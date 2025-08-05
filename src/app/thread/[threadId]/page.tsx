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
    addMessagesToTop,
    addMessageToBottom,
    updateMessage,
    deleteMessage,
  } = useThreadMessages();

  const messages = messagesByThread[threadId] || [];

  const [loadingMessages, setLoadingMessages] = useState(messages.length === 0);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Local "pending" (optimistic) messages shown immediately but not persisted
  const [pending, setPending] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const oldestTimestampRef = useRef<number | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commitInProgressRef = useRef(false); // prevent double sends

  const discardImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            // If a matching optimistic user message exists, remove it first.
            if (newMsg.sender === "user") {
              setPending((prev) =>
                prev.filter(
                  (p) =>
                    !(
                      p.sender === "user" &&
                      p.timestamp === newMsg.timestamp &&
                      (p.text ?? "") === (newMsg.text ?? "")
                    )
                )
              );
            }
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

  /** ---- API helper: no DB writes here ---- */
  const fetchBotResponse = async (
    userMessage: Message,
    imageBase64?: string | null
  ): Promise<Message> => {
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

    return botMessage;
  };

  /** ---- Send flow: optimistic user message + commit at the end ---- */
  const sendMessage = async () => {
    if (!user || !threadId) return;
    if (commitInProgressRef.current) return;

    const base64Image = await getImageBase64();
    if (!input.trim() && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();

    setIsFetchingResponse(true);
    commitInProgressRef.current = true;

    // Track which pending message to remove later (if commit/realtime succeeds)
    let pendingKey = { sender: "user" as const, timestamp };

    try {
      // 1) Upload image (optional)
      let imageData: Message["image"] | null = null;
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

          if (!uploadRes.error) {
            imageData = {
              id: fileId,
              path,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/messages/${path}`,
            };
          } else {
            console.error("Upload failed:", uploadRes.error.message);
          }
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      // 2) Prepare user message and show it optimistically
      const userMessage: Message = {
        text: input.trim() || null,
        sender: "user",
        timestamp,
        created_at: now,
        image: imageData,
      };

      setInput(threadId, "");
      discardImage();
      setPending((prev) => [...prev, userMessage]); // show immediately

      // 3) Query bot (no DB writes)
      const botMessage = await fetchBotResponse(userMessage, base64Image);

      // 4) Final commit (insert both, then update thread)
      try {
        await supabase.from("messages").insert([
          {
            user_id: user.id,
            thread_id: threadId,
            text: userMessage.text,
            sender: userMessage.sender,
            created_at: userMessage.created_at,
            timestamp: userMessage.timestamp,
            image: userMessage.image ?? null,
          },
          {
            user_id: user.id,
            thread_id: threadId,
            text: botMessage.text,
            sender: botMessage.sender,
            created_at: botMessage.created_at,
            timestamp: botMessage.timestamp,
            is_generated: true,
            image: null,
          },
        ]);

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

        // Realtime will insert the two messages shortly; remove the optimistic user message
        setPending((prev) =>
          prev.filter(
            (p) =>
              !(
                p.sender === pendingKey.sender &&
                p.timestamp === pendingKey.timestamp
              )
          )
        );
      } catch (commitErr) {
        console.error("Final commit failed:", commitErr);
        // Remove optimistic message on failure
        setPending((prev) =>
          prev.filter(
            (p) =>
              !(
                p.sender === pendingKey.sender &&
                p.timestamp === pendingKey.timestamp
              )
          )
        );
      }
    } catch (err) {
      console.error("sendMessage flow failed:", err);
      // Ensure pending is cleared on unexpected failure
      setPending((prev) =>
        prev.filter(
          (p) =>
            !(
              p.sender === pendingKey.sender &&
              p.timestamp === pendingKey.timestamp
            )
        )
      );
    } finally {
      setIsFetchingResponse(false);
      commitInProgressRef.current = false;
    }
  };

  if (loading) return null;

  // Merge store messages with local pending ones for display
  const displayedMessages = [...messages, ...pending];

  return (
    <ThreadLayout>
      <MessagesLayout
        messages={displayedMessages}
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
        fileInputRef={fileInputRef}
        discardImage={discardImage}
      />
    </ThreadLayout>
  );
};

export default Thread;
