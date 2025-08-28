"use client";

import { FC, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";

import { MessageInput } from "@/components";
import type { MessageInputHandle } from "@/components/MessageInput";
import { ThreadLayout, MessagesLayout } from "@/layouts";
import { speakText } from "@/lib";
import { useAuth, useThreadInput, useModel } from "@/stores";
import { v4 as uuidv4 } from "uuid";

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
}

const TempThread: FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const { getInput, setInput, getPreview, setPreview, getFile, setFile } =
    useThreadInput();
  const input = getInput("home");
  const preview = getPreview("home");
  const file = getFile("home");
  const { model } = useModel();

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const sendMessage = async (overrideText?: string) => {
    const imageBase64 = await getImageBase64();
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend && !imageBase64) return;

    const timestamp = Date.now();
    const now = new Date().toISOString();
    const fileId = uuidv4();

    const imageData = imageBase64
      ? {
          id: fileId,
          path: "",
          url: `data:image/png;base64,${imageBase64}`,
        }
      : null;

    const userMessage: Message = {
      id: uuidv4(),
      text: textToSend || null,
      sender: "user",
      timestamp,
      created_at: now,
      image: imageData,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("home", "");
    discardImage();
    setIsFetchingResponse(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend || null,
          image: imageBase64 || null,
          model,
        }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      const botMessage: Message = {
        id: uuidv4(),
        text: botResponse,
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
          id: uuidv4(),
          text: "Error fetching response",
          sender: "bot",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsFetchingResponse(false);
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

      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[index] = {
          ...botMessage,
          text: botResponse,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
        };
        return newMsgs;
      });
    } catch (err) {
      console.error("Error refetching bot response:", err);
    } finally {
      setIsFetchingResponse(false);
    }
  };
  const isBlocked = !user && !loading;

  return (
    <ThreadLayout
      onFileDrop={(file) => messageInputRef.current?.handleFile(file)}
    >
      <MessagesLayout
        messages={isBlocked ? [] : messages}
        isFetchingResponse={isBlocked ? false : isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessageId={playingMessageId}
        setPlayingMessageId={setPlayingMessageId}
        messagesEndRef={messagesEndRef}
        emptyStateText="Temporary Thread"
        onRetryMessage={isBlocked ? undefined : retryBotMessage}
      />
      <MessageInput
        ref={messageInputRef}
        input={isBlocked ? "" : input}
        setInput={(val) => setInput("home", val)}
        preview={isBlocked ? null : preview}
        setPreview={(val) => setPreview("home", val)}
        file={isBlocked ? null : file}
        setFile={(val) => setFile("home", val)}
        isListening={isBlocked ? false : isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
        fileInputRef={fileInputRef}
        discardImage={discardImage}
      />
    </ThreadLayout>
  );
};

export default TempThread;
