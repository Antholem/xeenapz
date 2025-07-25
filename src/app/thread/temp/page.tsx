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
  image_url?: string;
}

const TempThread: FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const sendMessage = async () => {
    if (!input.trim() && !imageFile) return;

    const timestamp = Date.now();
    const now = new Date().toISOString();

    let base64Image: string | undefined;
    let mimeType: string | undefined;

    if (imageFile) {
      mimeType = imageFile.type;
      base64Image = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res((fr.result as string).split(",")[1]);
        fr.onerror = () => rej(fr.error);
        fr.readAsDataURL(imageFile);
      });
    }

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp: timestamp,
      created_at: now,
      image_url: imagePreview ?? undefined,
    };

    setInput("home", "");
    setImageFile(null);
    setMessages((prev) => [...prev, userMessage]);
    fetchBotResponse(
      userMessage,
      base64Image && mimeType ? { base64: base64Image, mimeType } : undefined
    );
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
        imagePreview={imagePreview}
        onSelectImage={isBlocked ? () => {} : setImageFile}
      />
    </ThreadLayout>
  );
};

export default TempThread;
