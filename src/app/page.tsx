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

const Home: FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMessageTemporary } = useTempThread();
  const { getInput, setInput } = useThreadInput();
  const { setMessages: setGlobalMessages } = useThreadMessages();
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

  // Prevent duplicate "send" commits if user double-clicks
  const commitInProgressRef = useRef(false);

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

  /** ---- API helpers (no DB writes here) ---- */

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

  const fetchBotSetTitle = async (
    userMessageText: string,
    imageBase64: string | null
  ): Promise<string | null> => {
    const prompt =
      `Generate a short, descriptive title (only the title) for the following message.` +
      ` If an image is provided, consider its contents. Message: "${userMessageText}"`;

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, image: imageBase64 }),
    });

    const data = await res.json();
    const newTitle =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    return newTitle;
  };

  /** ---- Send flow: DB commit at the end ---- */

  const sendMessage = async () => {
    if (commitInProgressRef.current) return; // guard
    const base64Image = await getImageBase64();
    if (!input.trim() && !base64Image) return;

    const now = new Date().toISOString();
    const timestamp = Date.now();
    const fileId = uuidv4();

    const id = threadId || (user && !isMessageTemporary ? uuidv4() : null);
    const isNewThread = !!user && !threadId && !isMessageTemporary && !!id;

    setIsFetchingResponse(true);
    commitInProgressRef.current = true;

    try {
      // 1) Upload image first (to get URL)
      let imageData: Message["image"] | null = null;
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
          } else {
            console.error("Image upload error:", uploadRes.error);
          }
        } catch (e) {
          console.error("Failed to store image to Supabase:", e);
        }
      }

      // 2) Local UI: add user message
      const textToSend = input.trim() || null;
      const userMessage: Message = {
        text: textToSend,
        sender: "user",
        timestamp,
        created_at: now,
        image: imageData,
      };

      setInput("home", "");
      discardImage();
      setMessages((prev) => [...prev, userMessage]);

      // 3) Get bot response (no DB writes)
      const botMessage = await fetchBotResponse(userMessage, base64Image);
      setMessages((prev) => [...prev, botMessage]);

      // 4) Generate title ONLY if this is a brand new thread from "/"
      let computedTitle: string | null = null;
      if (isNewThread && pathname === "/") {
        try {
          computedTitle = await fetchBotSetTitle(textToSend ?? "", base64Image);
        } catch (e) {
          console.error("Title generation failed:", e);
        }
      }

      // 5) Commit everything to Supabase (at the end)
      if (user && !isMessageTemporary && id) {
        // create thread row if brand new
        if (isNewThread) {
          setThreadId(id);
          try {
            await supabase
              .from("users")
              .upsert({ id: user.id, user_id: user.id });
          } catch (e) {
            console.error("users upsert failed:", e);
          }

          try {
            await supabase.from("threads").insert({
              id,
              user_id: user.id,
              is_archived: false,
              is_deleted: false,
              is_pinned: false,
              created_at: now,
              updated_at: now,
              title: computedTitle ?? null,
              last_message: null,
            });
          } catch (e) {
            console.error("thread insert failed:", e);
          }
        } else if (computedTitle) {
          // If somehow we're on Home with an existing id and we computed a title,
          // update title only if it's currently null (defensive)
          try {
            await supabase
              .from("threads")
              .update({ title: computedTitle })
              .eq("id", id)
              .is("title", null);
          } catch (e) {
            console.error("thread title update failed:", e);
          }
        }

        // Insert both messages (user then bot), then update thread's last_message to bot
        try {
          await supabase.from("messages").insert([
            {
              user_id: user.id,
              thread_id: id,
              text: userMessage.text,
              sender: userMessage.sender,
              created_at: userMessage.created_at,
              timestamp: userMessage.timestamp,
              image: userMessage.image ?? null,
            },
            {
              user_id: user.id,
              thread_id: id,
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
              // For brand new threads, if we computed a title and the column is still null, set it.
              ...(isNewThread && computedTitle ? { title: computedTitle } : {}),
            })
            .eq("id", id);
        } catch (e) {
          console.error("message/thread commit failed:", e);
        }

        // Hydrate the global thread store AFTER commit, so the thread page won't
        // re-insert/duplicate via realtime immediately after navigation.
        try {
          setGlobalMessages(id, [userMessage, botMessage] as any);
        } catch (e) {
          console.error("setGlobalMessages failed:", e);
        }

        // 6) Navigate to /thread/:id after successful commit
        if (isNewThread && id) {
          window.history.pushState({}, "", `/thread/${id}`);
          // Clear local threadId to avoid Home state conflicting after navigation
          setThreadId(null);
        }
      }
    } catch (error) {
      console.error("sendMessage flow failed:", error);
    } finally {
      setIsFetchingResponse(false);
      commitInProgressRef.current = false;
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
