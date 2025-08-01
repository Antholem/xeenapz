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
  image?: {
    id: string;
    path: string;
    url: string;
  };
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const discardImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getImageBase64 = async (): Promise<string | null> => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1]; // strip prefix
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
    }
  };

  const sendMessage = async () => {
    const base64Image = await getImageBase64();
    if (!input.trim() && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();
    let id = threadId;
    const textToSend = input.trim() || "[Image sent]";

    // Create thread if needed
    if (user && !id && !isMessageTemporary) {
      id = uuidv4();
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

      window.history.pushState({}, "", `/thread/${id}`);
    }

    // Upload image and attach public URL
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

    const userMessage: Message = {
      text: textToSend,
      sender: "user",
      timestamp,
      created_at: now,
      image: imageData,
    };

    // set global messages if thread was just created
    if (user && id && id !== threadId && !isMessageTemporary) {
      setGlobalMessages(id, [userMessage]);
    }

    setInput("home", "");
    setMessages((prev) => [...prev, userMessage]);
    discardImage();

    // Insert message
    if (user && !isMessageTemporary && id) {
      try {
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

        addMessageToBottom(id, userMessage as any);

        await supabase.from("messages").insert({
          user_id: user.id,
          thread_id: id,
          text: userMessage.text,
          sender: userMessage.sender,
          created_at: now,
          timestamp,
          image: imageData ?? null,
        });

        await fetchBotSetTitle(userMessage.text, id);
        fetchBotResponse(userMessage, id, base64Image);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      fetchBotResponse(userMessage, null, base64Image);
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
        fileInputRef={fileInputRef}
        discardImage={discardImage}
      />
    </ThreadLayout>
  );
};

export default Home;
