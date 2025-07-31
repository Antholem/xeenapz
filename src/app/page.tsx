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
        }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      const botMessage: Message = {
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
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
      const prompt = `Generate a short, descriptive title (only the title) for the following message: "${userMessageText}"`;

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

  const sendMessage = async (imageFile?: File | null) => {
    if (!input.trim() && !imageFile) return;

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const timestamp = Date.now();
    const now = new Date().toISOString();
    let imageBase64: string | null = null;
    let imageUrl: string | null = null;

    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

    const textToSend = input.trim() || "[Image sent]";
    setInput("home", "");

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
              text: textToSend,
              sender: "user",
              created_at: now,
            },
          });

          await fetchBotSetTitle(textToSend, id);
          window.history.pushState({}, "", `/thread/${id}`);
        } else {
          await supabase
            .from("threads")
            .update({
              updated_at: now,
              last_message: {
                text: textToSend,
                sender: "user",
                created_at: now,
              },
            })
            .eq("id", id);
        }

        if (imageFile) {
          const ext = imageFile.name.split(".").pop();
          const filePath = `${user.id}/${id}/${uuidv4()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("messages")
            .upload(filePath, imageFile);
          if (!uploadError) {
            const { data } = supabase.storage
              .from("messages")
              .getPublicUrl(filePath);
            imageUrl = data.publicUrl;
          } else {
            console.error("Error uploading image:", uploadError);
          }
        }

        const userMessage: Message = {
          text: textToSend,
          sender: "user",
          timestamp,
          created_at: now,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        };

        setMessages((prev) => [...prev, userMessage]);

        if (!threadId) {
          setGlobalMessages(id, [userMessage]);
        } else {
          addMessageToBottom(id, userMessage);
        }

        await supabase.from("messages").insert({
          user_id: user.id,
          thread_id: id,
          text: userMessage.text,
          sender: userMessage.sender,
          created_at: now,
          timestamp,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        });

        fetchBotResponse(userMessage, id, imageBase64);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      const userMessage: Message = {
        text: textToSend,
        sender: "user",
        timestamp,
        created_at: now,
      };
      setMessages((prev) => [...prev, userMessage]);
      fetchBotResponse(userMessage, null, imageBase64);
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
      />
    </ThreadLayout>
  );
};

export default Home;
