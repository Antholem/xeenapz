"use client";

import { FC, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";
import { v4 as uuidv4 } from "uuid";

import { supabase, speakText } from "@/lib";
import {
  useAuth,
  useTempThread,
  useThreadInput,
  useThreadMessages,
  useModel,
  useChatSettings,
} from "@/stores";
import {
  shouldGenerateSuggestions,
  fetchFollowUpSuggestions,
} from "@/utils/smartSuggestions";
import { MessageInput } from "@/components";
import type { MessageInputHandle } from "@/components/MessageInput";
import { ThreadLayout, MessagesLayout } from "@/layouts";

interface Message {
  id: string;
  text: string | null;
  sender: "user" | "bot";
  timestamp: number;
  created_at?: string;
  image?: {
    id: string;
    path: string;
    url: string;
  } | null;
  suggestions?: string[];
}

const Home: FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMessageTemporary } = useTempThread();
  const { getInput, setInput, getPreview, setPreview, getFile, setFile } =
    useThreadInput();
  const { setMessages: setGlobalMessages, addMessageToBottom } =
    useThreadMessages();
  const { model } = useModel();
  const { smartSuggestions } = useChatSettings();
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const input = getInput("home");
  const preview = getPreview("home");
  const file = getFile("home");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevTranscriptRef = useRef("");
  const hasMounted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<MessageInputHandle | null>(null);

  const discardImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getImageBase64 = async (): Promise<string | null> => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (!user || isMessageTemporary) return;
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (pathname === "/") {
        setMessages([]);
        setThreadId(null);
      }
    } else if (pathname === "/") {
      setMessages([]);
      setThreadId(null);
    }
  }, [pathname, user, isMessageTemporary]);

  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.replace(prevTranscriptRef.current, "").trim();
      setInput("home", (prev) =>
        prev ? `${prev} ${newText}`.trim() : newText
      );
      prevTranscriptRef.current = transcript;
    }
  }, [transcript, setInput]);

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  useEffect(() => {
    const handleBeforeUnload = () => speechSynthesis.cancel();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      speechSynthesis.cancel();
    };
  }, []);

  const fetchBotResponse = async (
    userMessage: Message,
    threadId?: string | null,
    imageBase64?: string | null
  ) => {
    setIsFetchingResponse(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text || null,
          image: imageBase64 || null,
          model,
        }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      let suggestions: string[] | undefined;
      if (smartSuggestions && shouldGenerateSuggestions(botResponse)) {
        suggestions = await fetchFollowUpSuggestions(botResponse, model);
      }

      const botMessageId = uuidv4();
      const botMessage: Message = {
        id: botMessageId,
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        suggestions,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (user && threadId && !isMessageTemporary) {
        addMessageToBottom(threadId, botMessage);

        await supabase.from("messages").insert({
          id: botMessageId,
          user_id: user.id,
          thread_id: threadId,
          text: botMessage.text,
          sender: botMessage.sender,
          created_at: botMessage.created_at,
          is_generated: true,
          timestamp: botMessage.timestamp,
        });

        await supabase
          .from("threads")
          .update({
            updated_at: new Date().toISOString(),
            last_message: {
              text: botMessage.text,
              sender: botMessage.sender,
              created_at: botMessage.created_at,
            },
          })
          .eq("id", threadId);
      }
    } catch (error) {
      console.error("Error fetching bot response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const fetchBotSetTitle = async (
    userMessageText: string,
    imageBase64: string | null,
    threadId: string
  ) => {
    try {
      const prompt =
        `Generate a short, descriptive title (only the title) for the following message.` +
        ` If an image is provided, consider its contents. Message: "${userMessageText}"`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, image: imageBase64, model }),
      });

      const data = await res.json();
      const newTitle =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || threadId;

      await supabase
        .from("threads")
        .update({ title: newTitle })
        .eq("id", threadId);
    } catch (error) {
      console.error("Error setting title:", error);
    }
  };

  const retryBotMessage = async (botMessage: Message) => {
    const index = messages.findIndex((m) => m.timestamp === botMessage.timestamp);
    if (index === -1) return;

    const userMessage = (() => {
      for (let i = index - 1; i >= 0; i--) {
        if (messages[i].sender === "user") return messages[i];
      }
      return null;
    })();

    if (!userMessage) return;

    setMessages((prev) => {
      const newMsgs = [...prev];
      newMsgs[index] = { ...newMsgs[index], text: null };
      if (user && threadId && !isMessageTemporary) {
        setGlobalMessages(threadId, newMsgs);
      }
      return newMsgs;
    });
    let base64Image: string | null = null;
    if (userMessage.image?.url) {
      try {
        const resImg = await fetch(userMessage.image.url);
        const blob = await resImg.blob();
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to fetch image for retry:", e);
      }
    }

    setIsFetchingResponse(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text || null,
          image: base64Image,
          model,
        }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      let suggestions: string[] | undefined;
      if (smartSuggestions && shouldGenerateSuggestions(botResponse)) {
        suggestions = await fetchFollowUpSuggestions(botResponse, model);
      }

      const updatedMessage: Message = {
        ...botMessage,
        text: botResponse,
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        suggestions,
      };

      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[index] = updatedMessage;
        if (user && threadId && !isMessageTemporary) {
          setGlobalMessages(threadId, newMsgs);
        }
        return newMsgs;
      });

      if (user && threadId && !isMessageTemporary && botMessage.id) {
        await supabase
          .from("messages")
          .update({
            text: updatedMessage.text,
            created_at: updatedMessage.created_at,
            timestamp: updatedMessage.timestamp,
          })
          .eq("id", botMessage.id);
      }
    } catch (err) {
      console.error("Error refetching bot response:", err);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const base64Image = await getImageBase64();
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();
    const messageId = uuidv4();

    const id = threadId || (user && !isMessageTemporary ? uuidv4() : null);
    const isNewThread = !!user && !threadId && !isMessageTemporary && !!id;

    let imageData: Message["image"] | undefined;
    if (user && base64Image && id) {
      try {
        const binary = atob(base64Image);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }

        const file = new File([array], `${fileId}.png`, {
          type: "image/png",
        });

        const path = `${user.id}/${id}/${fileId}.png`;
        const uploadRes = await supabase.storage
          .from("messages")
          .upload(path, file);

        if (!uploadRes.error) {
          imageData = {
            id: fileId,
            path,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/messages/${path}`,
          };
        }
      } catch (e) {
        console.error("Failed to store image to Supabase:", e);
      }
    }

    if (user && isNewThread && id) {
      setThreadId(id);
      await supabase.from("users").upsert({ id: user.id, user_id: user.id });
      await supabase.from("threads").insert({
        id,
        user_id: user.id,
        is_archived: false,
        is_deleted: false,
        is_pinned: false,
        created_at: now,
        updated_at: now,
        last_message: null,
      });
    }

    const userMessage: Message = {
      id: messageId,
      text: textToSend || null,
      sender: "user",
      timestamp,
      created_at: now,
    };

    setInput("home", "");
    discardImage();

    setMessages((prev) => [...prev, { ...userMessage, image: imageData }]);

    if (user && !isMessageTemporary && id) {
      try {
        if (isNewThread) {
          setGlobalMessages(id, [{ ...userMessage, image: imageData } as any]);
        } else {
          addMessageToBottom(id, { ...userMessage, image: imageData } as any);
        }

        await supabase.from("messages").insert({
          id: messageId,
          user_id: user.id,
          thread_id: id,
          text: userMessage.text,
          sender: userMessage.sender,
          created_at: now,
          timestamp,
          image: imageData ?? null,
        });

        await supabase
          .from("threads")
          .update({
            updated_at: now,
            last_message: {
              text: userMessage.text,
              sender: userMessage.sender,
              created_at: now,
            },
          })
          .eq("id", id);

        await fetchBotResponse(userMessage, id, base64Image);

        if (isNewThread && pathname === "/") {
          await fetchBotSetTitle(userMessage.text ?? "", base64Image, id);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      await fetchBotResponse(userMessage, null, base64Image);
    }

    if (isNewThread && id) {
      window.history.pushState({}, "", `/thread/${id}`);
      setThreadId(null);
    }
  };

  const handleSelectSuggestion = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <ThreadLayout
      onFileDrop={(file) => messageInputRef.current?.handleFile(file)}
    >
      <MessagesLayout
        messages={messages}
        isFetchingResponse={isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessageId={playingMessageId}
        setPlayingMessageId={setPlayingMessageId}
        messagesEndRef={messagesEndRef}
        onRetryMessage={retryBotMessage}
        onSelectSuggestion={handleSelectSuggestion}
      />
      <MessageInput
        ref={messageInputRef}
        input={input}
        setInput={(val) => setInput("home", val)}
        preview={preview}
        setPreview={(val) => setPreview("home", val)}
        file={file}
        setFile={(val) => setFile("home", val)}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
        fileInputRef={fileInputRef}
        discardImage={discardImage}
      />
    </ThreadLayout>
  );
};

export default Home;
