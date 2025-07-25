"use client";

import { FC, useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const oldestTimestampRef = useRef<number | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(null);
  }, [imageFile]);

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

  const fetchBotResponse = async (userMessage: Message) => {
    if (!user || !threadId) return;

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
        const filePath = `${user.id}/messages/${threadId}/${fileName}`;
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

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || !user || !threadId) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user.id}/messages/${threadId}/${fileName}`;
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
      timestamp,
      created_at: now,
    };

    setInput(threadId, "");
    setImageFile(null);
    addMessageToBottom(threadId, userMessage);

    try {
      await supabase.from("messages").insert({
        user_id: user.id,
        thread_id: threadId,
        text: userMessage.text,
        image_url: imageUrl,
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
        imageFile={imageFile}
        setImageFile={setImageFile}
        imagePreview={imagePreview}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default Thread;
