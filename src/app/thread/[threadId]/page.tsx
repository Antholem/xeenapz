"use client";

import { FC, useEffect, useRef, useState } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { useSpeechRecognition } from "react-speech-recognition";
import { v4 as uuidv4 } from "uuid";

import { ThreadLayout, MessagesLayout } from "@/layouts";
import { MessageInput } from "@/components";
import type { MessageInputHandle } from "@/components/MessageInput";
import { supabase, speakText } from "@/lib";
import {
  useAuth,
  useThreadInput,
  useThreadMessages,
  useModel,
  type Message,
} from "@/stores";

const Thread: FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [scrollKey, setScrollKey] = useState<string | null>(null);

  useEffect(() => {
    const messageId = searchParams.get("messageId");
    const key = searchParams.get("scrollKey");
    if (messageId || key) {
      setTargetMessageId(messageId);
      setScrollKey(key);
      router.replace(`/thread/${threadId}`, { scroll: false });
    }
  }, [searchParams, router, threadId]);

  useEffect(() => {
    if (!targetMessageId && !scrollKey) return;
    const timer = setTimeout(() => {
      setTargetMessageId(null);
      setScrollKey(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [targetMessageId, scrollKey]);

  const { user, loading } = useAuth();
  const { getInput, setInput, getPreview, setPreview, getFile, setFile } =
    useThreadInput();
  const input = getInput(threadId || "home");
  const preview = getPreview(threadId || "home");
  const file = getFile(threadId || "home");
  const { model } = useModel();

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
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const oldestTimestampRef = useRef<number | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<MessageInputHandle | null>(null);

  const discardImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          model,
        }),
      });

      const data = await res.json();
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      const botMessageId = uuidv4();
      const botMessage: Message = {
        id: botMessageId,
        text: botText,
        sender: "bot",
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
      };

      addMessageToBottom(threadId, botMessage);

      try {
        await supabase.from("messages").insert({
          id: botMessageId,
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

  const retryBotMessage = async (botMessage: Message) => {
    if (!threadId) return;

    const index = messages.findIndex((m) => m.timestamp === botMessage.timestamp);
    if (index === -1) return;

    const userMessage = (() => {
      for (let i = index - 1; i >= 0; i--) {
        if (messages[i].sender === "user") return messages[i];
      }
      return null;
    })();

    if (!userMessage) return;

    const temp = [...messages];
    temp[index] = { ...temp[index], text: null };
    setMessages(threadId, temp);

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
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      const updatedMessage: Message = {
        ...botMessage,
        text: botText,
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
      };

      const newMessages = [...temp];
      newMessages[index] = updatedMessage;
      setMessages(threadId, newMessages);

      if (botMessage.id) {
        await supabase
          .from("messages")
          .update({
            text: updatedMessage.text,
            created_at: updatedMessage.created_at,
            timestamp: updatedMessage.timestamp,
          })
          .eq("id", botMessage.id);
      }
    } catch (err) {
      console.error("Error refetching bot response:", err);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async (overrideText?: string) => {
    if (!user || !threadId) return;

    const base64Image = await getImageBase64();
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();
    const messageId = uuidv4();

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
      id: messageId,
      text: textToSend || null,
      sender: "user",
      timestamp,
      created_at: now,
    };

    setInput(threadId, "");
    discardImage();

    addMessageToBottom(threadId, { ...userMessage, image: imageData });

    try {
      await supabase.from("messages").insert({
        id: messageId,
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
    <ThreadLayout
      onFileDrop={(file) => messageInputRef.current?.handleFile(file)}
    >
      <MessagesLayout
        messages={messages}
        isFetchingResponse={isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessageId={playingMessageId}
        setPlayingMessageId={setPlayingMessageId}
        messagesEndRef={messagesEndRef}
        onLoadMore={handleLoadMessages}
        isLoading={loadingMessages}
        onRetryMessage={retryBotMessage}
        targetMessageId={targetMessageId}
        scrollKey={scrollKey}
      />
      <MessageInput
        ref={messageInputRef}
        input={input}
        setInput={(val) => setInput(threadId || "home", val)}
        preview={preview}
        setPreview={(val) => setPreview(threadId || "home", val)}
        file={file}
        setFile={(val) => setFile(threadId || "home", val)}
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

export default Thread;
