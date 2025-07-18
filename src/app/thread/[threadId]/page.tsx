"use client";

import { FC, useState, useEffect, useRef } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";
import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { useAuth, useThreadInput, useThreadMessages, Message } from "@/stores";
import { speakText } from "@/lib";
import { supabase } from "@/lib/supabaseClient";

interface ThreadParams {
  [key: string]: string | undefined;
  threadId?: string;
}

const Thread: FC = () => {
  const { threadId } = useParams<ThreadParams>();
  const router = useRouter();

  const { user, loading } = useAuth();
  const { getInput, setInput } = useThreadInput();
  const input = getInput(threadId || "home");

  const {
    messagesByThread,
    setMessages,
    addMessagesToTop,
    addMessageToBottom,
  } = useThreadMessages();

  const storedMessages = messagesByThread[threadId || ""] || [];

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!threadId || !user || storedMessages.length > 0) {
      setLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("user_id", user.id)
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (error || !data || data.length === 0) {
          notFound();
          return;
        }

        setMessages(threadId, data as Message[]);
        setOldestTimestamp(data[0].timestamp || null);
      } catch (err) {
        console.error("Error loading thread:", err);
        notFound();
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [threadId, user, storedMessages.length, setMessages]);

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

  const fetchOlderMessages = async (): Promise<Message[]> => {
    if (!threadId || !hasMore || !oldestTimestamp || !user) return [];

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .lt("timestamp", oldestTimestamp)
        .order("created_at", { ascending: true })
        .limit(20);

      if (error || !data || data.length === 0) {
        setHasMore(false);
        return [];
      }

      setOldestTimestamp(data[0].timestamp);
      return data as Message[];
    } catch (err) {
      console.error("Error fetching older messages:", err);
      return [];
    }
  };

  const handleLoadMessages = async () => {
    const olderMessages = await fetchOlderMessages();
    addMessagesToTop(threadId!, olderMessages);
  };

  const fetchBotResponse = async (userMessage: Message, id: string) => {
    if (!user || !threadId) return;

    setIsFetchingResponse(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      const botMessage: Message = {
        text: botText,
        sender: "bot",
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      addMessageToBottom(id, botMessage);

      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: id,
        text: botMessage.text,
        sender: "bot",
        created_at: botMessage.createdAt,
        timestamp: botMessage.timestamp,
        is_generated: true,
      });

      await supabase
        .from("threads")
        .update({
          updated_at: new Date().toISOString(),
          last_message: {
            text: botMessage.text,
            sender: botMessage.sender,
            created_at: botMessage.createdAt,
          },
        })
        .eq("id", id)
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error fetching bot response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !threadId) return;

    const timestamp = Date.now();
    const createdAt = new Date().toISOString();

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt,
    };

    setInput(threadId, "");
    addMessageToBottom(threadId, userMessage);

    try {
      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: threadId,
        text: userMessage.text,
        sender: "user",
        created_at: userMessage.createdAt,
        timestamp: userMessage.timestamp,
      });

      await supabase
        .from("threads")
        .update({
          updated_at: createdAt,
          last_message: {
            text: userMessage.text,
            sender: userMessage.sender,
            created_at: userMessage.createdAt,
          },
        })
        .eq("id", threadId)
        .eq("user_id", user.id);

      fetchBotResponse(userMessage, threadId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return null;

  return (
    <ThreadLayout>
      <MessagesLayout
        messages={user ? storedMessages : []}
        isFetchingResponse={user ? isFetchingResponse : false}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
        onLoadMore={handleLoadMessages}
        isLoading={loadingMessages}
      />
      <MessageInput
        input={user ? input : ""}
        setInput={(val) => setInput(threadId || "home", val)}
        isListening={user ? isListening : false}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default Thread;
