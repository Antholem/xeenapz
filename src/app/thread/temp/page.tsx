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
  image_url?: string | null;
  created_at?: string;
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
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(null);
  }, [imageFile]);

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
        body: JSON.stringify({ text: userMessage.text, imageUrl: userMessage.image_url }),
      });

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => p.text)?.text || "";
      const imagePart = parts.find((p: any) => p.inline_data);
      let botImageUrl: string | null = null;
      if (imagePart?.inline_data?.data) {
        const { data: base64, mime_type } = imagePart.inline_data;
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime_type });
        const fileExt = mime_type.split("/")[1];
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `temp/messages/temp/${fileName}`;
        const { error } = await supabase.storage
          .from("images")
          .upload(filePath, blob, { upsert: true, contentType: mime_type });
        if (!error) {
          botImageUrl =
            supabase.storage.from("images").getPublicUrl(filePath).data.publicUrl;
        }
      }

      const botMessage: Message = {
        text: textPart,
        image_url: botImageUrl ?? undefined,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
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
    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `temp/messages/temp/${fileName}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, imageFile, { upsert: true });
      if (!error) {
        imageUrl = supabase.storage.from("images").getPublicUrl(filePath).data.publicUrl;
      }
    }

    const userMessage: Message = {
      text: input,
      image_url: imageUrl ?? undefined,
      sender: "user",
      timestamp: timestamp,
      created_at: now,
    };

    setInput("home", "");
    setImageFile(null);
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
        imageFile={imageFile}
        setImageFile={setImageFile}
        imagePreview={imagePreview}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default TempThread;
