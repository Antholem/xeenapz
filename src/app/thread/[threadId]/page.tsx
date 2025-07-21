"use client";

import { FC, useState, useEffect, useRef } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";
import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { supabase, speakText } from "@/lib";
import { useAuth, useThreadInput, Message } from "@/stores";

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

  const [messages, setMessages] = useState<Message[]>([]);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [oldestDoc, setOldestDoc] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!threadId || !user || messages.length > 0) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    setOldestDoc(null);
    setHasMore(true);

    const fetchData = async () => {
      const { data: threadData, error: threadError } = await supabase
        .from("threads")
        .select("id")
        .eq("id", threadId)
        .eq("user_id", user.uid)
        .single();

      if (threadError || !threadData) {
        notFound();
        return;
      }

      const { data: messageData } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.uid)
        .eq("thread_id", threadId)
        .order("created_at");

      if (messageData) {
        setMessages(messageData as Message[]);
        if (messageData.length > 0) {
          setOldestDoc(messageData[0].created_at);
        }
      }

      setLoadingMessages(false);
    };

    fetchData();
  }, [threadId, user, messages.length]);

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
    if (!threadId || !hasMore || !oldestDoc || !user) return [];

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.uid)
        .eq("thread_id", threadId)
        .lt("created_at", oldestDoc)
        .order("created_at", { ascending: true })
        .limit(20);

      if (error || !data || data.length === 0) {
        setHasMore(false);
        return [];
      }

      setOldestDoc(data[0].created_at);
      return data as Message[];
    } catch (err) {
      console.error("Error fetching older messages:", err);
      return [];
    }
  };

  const handleLoadMessages = async () => {
    const olderMessages = await fetchOlderMessages();
    setMessages((prev) => [...olderMessages, ...prev]);
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

      setMessages((prev) => [...prev, botMessage]);

      await supabase
        .from("messages")
        .insert({
          ...botMessage,
          is_generated: true,
          user_id: user.uid,
          thread_id: id,
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
        .eq("user_id", user.uid);
    } catch (error) {
      console.error("Error fetching bot response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !threadId) return;

    const timestamp = Date.now();
    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt: new Date().toISOString(),
    };

    setInput(threadId, "");
    setMessages((prev) => [...prev, userMessage]);

    try {
      await supabase
        .from("messages")
        .insert({
          ...userMessage,
          user_id: user.uid,
          thread_id: threadId,
        });

      await supabase
        .from("threads")
        .update({
          updated_at: new Date().toISOString(),
          last_message: {
            text: userMessage.text,
            sender: userMessage.sender,
            created_at: userMessage.createdAt,
          },
        })
        .eq("id", threadId)
        .eq("user_id", user.uid);

      fetchBotResponse(userMessage, threadId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return null;

  return (
    <ThreadLayout>
      <MessagesLayout
        messages={user ? messages : []}
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
