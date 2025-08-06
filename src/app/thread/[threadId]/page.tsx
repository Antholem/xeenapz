"use client";

import { FC, useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";
import { v4 as uuidv4 } from "uuid";

import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { supabase, speakText } from "@/lib";
import {
  useAuth,
  useThreadInput,
  useThreadMessages,
  type Message,
} from "@/stores";

const Thread: FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();

  const { user, loading } = useAuth();
  const { getInput, setInput } = useThreadInput();
  const input = getInput(threadId || "home");

  const {
    messagesByThread,
    setMessages,
    addMessageToBottom,
    addMessagesToTop,
    updateMessage,
    deleteMessage,
  } = useThreadMessages();

  const messages = messagesByThread[threadId] || [];

  const [loadingMessages, setLoadingMessages] = useState(messages.length === 0);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const oldestTimestampRef = useRef<number | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const discardImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      const event = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  const getImageBase64 = async (): Promise<string | null> => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return null;

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
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!threadId || !user || messages.length > 0) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(30);

      if (error || !data) {
        console.error("Error fetching messages:", error);
        notFound();
        return;
      }

      setMessages(threadId, data);
      oldestTimestampRef.current = data[0]?.timestamp ?? null;
      setHasMore(data.length === 30);
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [threadId, user, messages.length, setMessages]);

  useEffect(() => {
    if (!user || !threadId) return;

    const channel = supabase
      .channel(`messages-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const oldMsg = payload.old as Message;

          if (payload.eventType === "INSERT") {
            addMessageToBottom(threadId, newMsg);
          } else if (payload.eventType === "UPDATE") {
            updateMessage(threadId, newMsg.id!, newMsg);
          } else if (payload.eventType === "DELETE") {
            deleteMessage(threadId, oldMsg.id!);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, threadId, addMessageToBottom, updateMessage, deleteMessage]);

  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.replace(prevTranscriptRef.current, "").trim();
      setInput(threadId || "home", (prev) =>
        prev ? `${prev} ${newText}`.trim() : newText
      );
      prevTranscriptRef.current = transcript;
    }
  }, [transcript, threadId, setInput]);

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  const handleLoadMessages = async () => {
    if (!threadId || !user || !hasMore || !oldestTimestampRef.current) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .lt("timestamp", oldestTimestampRef.current)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error || !data || data.length === 0) {
      setHasMore(false);
      return;
    }

    oldestTimestampRef.current =
      data[0].timestamp ?? oldestTimestampRef.current;
    addMessagesToTop(threadId, data);
  };

  const fetchBotResponse = async (
    userMessage: Message,
    imageBase64?: string | null
  ) => {
    if (!user || !threadId) return;

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
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      const botMessage: Message = {
        text: botText,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
      };

      addMessageToBottom(threadId, botMessage);

      try {
        await supabase.from("messages").insert({
          user_id: user.id,
          thread_id: threadId,
          text: botMessage.text,
          sender: botMessage.sender,
          created_at: botMessage.created_at,
          is_generated: true,
          timestamp: botMessage.timestamp,
        });
      } catch (err) {
        console.error("Bot message insert failed:", err);
      }

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
    } catch (err) {
      console.error("Error fetching bot response:", err);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !threadId) return;

    const base64Image = await getImageBase64();
    if (!input.trim() && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();

    let imageData: Message["image"] | undefined;
    if (base64Image) {
      try {
        const binary = atob(base64Image);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }

        const file = new File([array], `${fileId}.png`, {
          type: "image/png",
        });

        const path = `${user.id}/${threadId}/${fileId}.png`;
        const uploadRes = await supabase.storage
          .from("messages")
          .upload(path, file);

        if (uploadRes.error) {
          console.error("Upload failed:", uploadRes.error.message);
        } else {
          imageData = {
            id: fileId,
            path,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/messages/${path}`,
          };
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    const userMessage: Message = {
      text: input.trim() || null,
      sender: "user",
      timestamp,
      created_at: now,
    };

    setInput(threadId, "");
    discardImage();

    addMessageToBottom(threadId, { ...userMessage, image: imageData });

    try {
      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: threadId,
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
        .eq("id", threadId);

      await fetchBotResponse(userMessage, base64Image);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return null;

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
        onLoadMore={handleLoadMessages}
        isLoading={loadingMessages}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
      />
      <MessageInput
        input={input}
        setInput={(val) => setInput(threadId || "home", val)}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
        fileInputRef={fileInputRef}
        discardImage={discardImage}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
      />
    </ThreadLayout>
  );
};

export default Thread;
