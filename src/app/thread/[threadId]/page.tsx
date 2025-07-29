"use client";

import { FC, useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";

import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { supabase, speakText } from "@/lib";
import { uploadImage } from "@/utils/uploadImage";
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
    } catch (err) {
      console.error("Error fetching bot response:", err);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async (
    imageBase64?: string | null,
    imageFile?: File | null
  ) => {
    if (!user || !threadId || (!input.trim() && !imageBase64)) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();

    const userMessage: Message = {
      text: input.trim() || "[Image sent]",
      sender: "user",
      timestamp,
      created_at: now,
      image_path: null,
    };

    let imagePath: string | null = null;
    if (imageFile) {
      imagePath = await uploadImage(user.id, imageFile);
    }

    userMessage.image_path = imagePath;

    setInput(threadId, "");
    addMessageToBottom(threadId, userMessage);

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

      await fetchBotResponse(userMessage, imageBase64);
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
