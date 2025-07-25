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
} from "@/stores";
import { MessageInput } from "@/components";
import { ThreadLayout, MessagesLayout } from "@/layouts";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  created_at?: string;
  image_url?: string;
}

const Home: FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMessageTemporary } = useTempThread();
  const { getInput, setInput } = useThreadInput();
  const { setMessages: setGlobalMessages, addMessageToBottom } =
    useThreadMessages();
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const input = getInput("home");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevTranscriptRef = useRef("");
  const hasMounted = useRef(false);

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
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

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
    imageData?: { base64: string; mimeType: string }
  ) => {
    setIsFetchingResponse(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage.text,
          image: imageData?.base64,
          mimeType: imageData?.mimeType,
        }),
      });

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let botResponse = "";
      let botImage: string | undefined;
      parts.forEach((p: any) => {
        if (p.text) botResponse += p.text;
        if (p.inlineData) {
          botImage = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
        }
      });

      const botMessage: Message = {
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        image_url: botImage,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (user && threadId && !isMessageTemporary) {
        addMessageToBottom(threadId, botMessage);

        await supabase.from("messages").insert({
          user_id: user.id,
          thread_id: threadId,
          text: botMessage.text,
          sender: botMessage.sender,
          created_at: botMessage.created_at,
          is_generated: true,
          timestamp: botMessage.timestamp,
          image_url: botImage ?? null,
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
      setMessages((prev) => [
        ...prev,
        {
          text: "Error fetching response",
          sender: "bot",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const fetchBotSetTitle = async (
    userMessageText: string,
    threadId: string
  ) => {
    try {
      const prompt = `Generate a short, descriptive title/subject/topic (only the title, no extra words) for the following thread message: "${userMessageText}"`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
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

      await supabase
        .from("threads")
        .update({ title: threadId })
        .eq("id", threadId);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !imageFile) return;

    const timestamp = Date.now();
    const now = new Date().toISOString();

    let uploadedUrl: string | null = null;
    let base64Image: string | undefined;
    let mimeType: string | undefined;

    if (imageFile) {
      const path = `${user?.id ?? "temp"}/messages/${threadId ?? "temp"}/${Date.now()}-${imageFile.name}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(path, imageFile);
      if (!error) {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        uploadedUrl = data.publicUrl;
        mimeType = imageFile.type;
        const reader = await new Promise<string>((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res((fr.result as string).split(",")[1]);
          fr.onerror = () => rej(fr.error);
          fr.readAsDataURL(imageFile);
        });
        base64Image = reader;
      }
    }

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      created_at: now,
      image_url: uploadedUrl ?? undefined,
    };

    setInput("home", "");
    setImageFile(null);
    setMessages((prev) => [...prev, userMessage]);

    if (user && !isMessageTemporary) {
      try {
        let id = threadId;

        if (!id) {
          id = uuidv4();
          setThreadId(id);

          await supabase
            .from("users")
            .upsert({ id: user.id, user_id: user.id });

          await supabase.from("threads").insert({
            id,
            user_id: user.id,
            is_archived: false,
            is_deleted: false,
            is_pinned: false,
            created_at: now,
            updated_at: now,
            last_message: {
              text: userMessage.text,
              sender: userMessage.sender,
              created_at: now,
            },
          });

          await fetchBotSetTitle(userMessage.text, id);
          window.history.pushState({}, "", `/thread/${id}`);
          setGlobalMessages(id, [userMessage]);
        } else {
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

          addMessageToBottom(id, userMessage);
        }

        await supabase.from("messages").insert({
          user_id: user.id,
          thread_id: id,
          text: userMessage.text,
          sender: userMessage.sender,
          created_at: now,
          timestamp,
          image_url: uploadedUrl,
        });

        fetchBotResponse(
          userMessage,
          id,
          base64Image && mimeType ? { base64: base64Image, mimeType } : undefined
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      fetchBotResponse(
        userMessage,
        undefined,
        base64Image && mimeType ? { base64: base64Image, mimeType } : undefined
      );
    }
  };

  return (
    <ThreadLayout>
      <MessagesLayout
        messages={messages}
        isFetchingResponse={isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
      />
      <MessageInput
        input={input}
        setInput={(val) => setInput("home", val)}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
        imagePreview={imagePreview}
        onSelectImage={setImageFile}
      />
    </ThreadLayout>
  );
};

export default Home;
