"use client";

import { useState, useEffect, useRef, FC } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSpeechRecognition } from "react-speech-recognition";
import { speakText } from "@/lib/textToSpeech";
import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "@/lib/firebase";
import { useAuth, useThreadInput, useThreadMessages } from "@/stores";
import { MessageInput } from "@/components";
import { ThreadLayout, MessagesLayout } from "@/layouts";
import { usePathname } from "next/navigation";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

const Home: FC = () => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { getInput, setInput } = useThreadInput();
  const input = getInput("home");
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");
  const { user } = useAuth();
  const pathname = usePathname();
  const hasMounted = useRef(false);

  const { setMessages: setGlobalMessages, addMessageToBottom } =
    useThreadMessages();

  useEffect(() => {
    if (!user) return;

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
  }, [pathname, user]);

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
    threadId?: string | null
  ) => {
    setIsFetchingResponse(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      const botMessage: Message = {
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (user && threadId) {
        addMessageToBottom(threadId, botMessage);

        const messagesRef = collection(db, "threads", threadId, "messages");
        await addDoc(messagesRef, {
          ...botMessage,
          isGenerated: true,
        });

        await setDoc(
          doc(db, "threads", threadId),
          {
            updatedAt: serverTimestamp(),
            lastMessage: {
              text: botMessage.text,
              sender: botMessage.sender,
              createdAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error fetching bot response:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Error fetching response",
          sender: "bot",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const fetchBotSetTitle = async (
    userMessageText: string,
    threadId: string
  ) => {
    try {
      const titlePrompt = `Generate a short, descriptive title/subject/topic (only the title, no extra words) for the following thread message: "${userMessageText}"`;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: titlePrompt }),
      });

      const data = await res.json();
      const newTitle = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (newTitle) {
        await setDoc(
          doc(db, "threads", threadId),
          { title: newTitle },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error setting title:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const timestamp = Date.now();
    const now = new Date().toISOString();

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt: now,
    };

    setInput("home", "");
    setMessages((prev) => [...prev, userMessage]);

    if (user) {
      try {
        let id = threadId;

        if (!id) {
          id = uuidv4();
          setThreadId(id);

          await setDoc(doc(db, "threads", id), {
            userId: user.uid,
            title: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
            lastMessage: {
              text: userMessage.text,
              sender: userMessage.sender,
              createdAt: now,
            },
          });

          fetchBotSetTitle(userMessage.text, id);
          window.history.pushState({}, "", `/thread/${id}`);
          setGlobalMessages(id, [userMessage]);
        } else {
          await setDoc(
            doc(db, "threads", id),
            {
              updatedAt: serverTimestamp(),
              lastMessage: {
                text: userMessage.text,
                sender: userMessage.sender,
                createdAt: now,
              },
            },
            { merge: true }
          );

          addMessageToBottom(id, userMessage);
        }

        const messagesRef = collection(db, "threads", id, "messages");

        await addDoc(messagesRef, {
          ...userMessage,
          createdAt: now,
        });

        fetchBotResponse(userMessage, id);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      fetchBotResponse(userMessage);
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
      />
    </ThreadLayout>
  );
};

export default Home;
