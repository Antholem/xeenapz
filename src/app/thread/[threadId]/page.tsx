"use client";

import { FC, useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";

import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { supabase, speakText } from "@/lib";
import { useAuth, useThreadInput } from "@/stores";

interface Message {
  id?: string;
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

const Thread: FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();

  const { user, loading } = useAuth();
  const { getInput, setInput } = useThreadInput();
  const input = getInput(threadId || "home");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");
  const oldestTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!threadId || !user) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(30);

      if (error) {
        console.error("Error fetching thread:", error);
        notFound();
        return;
      }

      if (data.length > 0) {
        setMessages(data as Message[]);
        oldestTimestampRef.current = data[0].timestamp ?? null;
        setHasMore(true);
      } else {
        setMessages([]);
        setHasMore(false);
      }

      setLoadingMessages(false);
    };

    fetchMessages();
  }, [threadId, user]);

  useEffect(() => {
    if (!user || !threadId) return;

    const channel = supabase
      .channel(`messages-realtime-${threadId}`)
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
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMsg.id);
              return exists ? prev : [...prev, newMsg];
            });
          }

          if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === newMsg.id ? { ...msg, ...newMsg } : msg
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== oldMsg.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, threadId]);

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

    if (error) {
      console.error("Error loading older messages:", error);
      return;
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      return;
    }

    setMessages((prev) => [...data, ...prev]);
    oldestTimestampRef.current =
      data[0].timestamp ?? oldestTimestampRef.current;
  };

  const fetchBotResponse = async (userMessage: Message) => {
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

      setMessages((prev) => [...prev, botMessage]);

      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: threadId,
        text: botMessage.text,
        sender: botMessage.sender,
        created_at: botMessage.createdAt,
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
            created_at: botMessage.createdAt,
          },
        })
        .eq("id", threadId);
    } catch (error) {
      console.error("Error fetching bot response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !threadId) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt: now,
    };

    setInput(threadId, "");
    setMessages((prev) => [...prev, userMessage]);

    try {
      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: threadId,
        text: userMessage.text,
        sender: userMessage.sender,
        created_at: now,
        timestamp,
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

      fetchBotResponse(userMessage);
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
      />
      <MessageInput
        input={input}
        setInput={(val) => setInput(threadId || "home", val)}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default Thread;
