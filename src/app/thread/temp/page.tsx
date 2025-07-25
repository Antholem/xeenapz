"use client";

import { FC, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";

import { MessageInput } from "@/components";
import { ThreadLayout, MessagesLayout } from "@/layouts";
import { speakText } from "@/lib";
import { useAuth, useThreadInput } from "@/stores";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  created_at?: string;
  imageUrl?: string;
}

const TempThread: FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);

  const { getInput, setInput } = useThreadInput();
  const input = getInput("home");

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (pathname === "/") {
        setMessages([]);
      }
    } else if (pathname === "/") {
      setMessages([]);
    }
  }, [pathname, user]);

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

  const fetchBotResponse = async (userMessage: Message) => {
    setIsFetchingResponse(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text, image: userMessage.imageUrl }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      const imagePart = data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inline_data
      );
      const botMessage: Message = {
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        imageUrl: imagePart?.inline_data?.data
          ? `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`
          : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
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

  const sendMessage = async (imageUrl?: string | null) => {
    if (!input.trim() && !imageUrl) return;

    const timestamp = Date.now();
    const now = new Date().toISOString();
    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp: timestamp,
      created_at: now,
      imageUrl: imageUrl || undefined,
    };

    setInput("home", "");
    setMessages((prev) => [...prev, userMessage]);
    fetchBotResponse(userMessage);
  };

  const isBlocked = !user && !loading;

  return (
    <ThreadLayout>
      <MessagesLayout
        messages={isBlocked ? [] : messages}
        isFetchingResponse={isBlocked ? false : isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
        emptyStateText="Temporary Thread"
      />
      <MessageInput
        input={isBlocked ? "" : input}
        setInput={(val) => setInput("home", val)}
        isListening={isBlocked ? false : isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default TempThread;
