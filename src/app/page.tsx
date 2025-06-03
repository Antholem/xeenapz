"use client";

import { useState, useEffect, useRef, FC } from "react";
import { useSpeechRecognition } from "react-speech-recognition";
import { speakText } from "@/lib/textToSpeech";
import { useAuth } from "@/app/context/Auth";
import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { MessageInput, MessagesLayout } from "@/components/";
import { ConversationLayout } from "@/layouts";
import { usePathname } from "next/navigation";
import useTemporaryChat from "@/stores/useTemporaryChat";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

const Home: FC = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");
  const { user } = useAuth();
  const { isMessageTemporary } = useTemporaryChat();
  const pathname = usePathname();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!user || isMessageTemporary) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (pathname === "/") {
        setMessages([]);
        setConversationId(null);
      }
    } else if (pathname === "/") {
      setMessages([]);
      setConversationId(null);
    }
  }, [pathname, user, isMessageTemporary]);

  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.replace(prevTranscriptRef.current, "").trim();
      setInput((prev) => (prev ? `${prev} ${newText}`.trim() : newText));
      prevTranscriptRef.current = transcript;
    }
  }, [transcript]);

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
    convoId?: string | null
  ) => {
    setIsFetchingResponse(true);

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

    if (user && convoId && !isMessageTemporary) {
      try {
        setMessages((prev) => [...prev, botMessage]);
        setIsFetchingResponse(false);

        const messagesRef = collection(
          db,
          "conversations",
          convoId,
          "messages"
        );
        await addDoc(messagesRef, {
          ...botMessage,
          createdAt: new Date().toISOString(),
          isGenerated: true,
        });

        await setDoc(
          doc(db, "conversations", convoId),
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

        if (!conversationId && convoId && pathname === "/") {
          window.history.pushState({}, "", `/chat/${convoId}`);
          setConversationId(convoId);
        }
      } catch (error) {
        console.error("Error fetching response:", error);
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
    } else {
      try {
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error fetching response:", error);

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
    }
  };

  const fetchBotSetTitle = async (userMessageText: string, convoId: string) => {
    try {
      const titlePrompt = `Generate a short, descriptive title/subject/topic (only the title, no extra words) for the following chat message: "${userMessageText}"`;
      const titleResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: titlePrompt }),
      });

      const titleData = await titleResponse.json();
      const newTitle =
        titleData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (newTitle) {
        await setDoc(
          doc(db, "conversations", convoId),
          {
            title: newTitle,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error fetching and setting title:", error);
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

    setInput("");
    setMessages((prev) => [...prev, userMessage]);

    if (user && !isMessageTemporary) {
      try {
        let convoId = conversationId;

        if (!convoId) {
          convoId = uuidv4();
          setConversationId(convoId);

          await setDoc(doc(db, "conversations", convoId), {
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

          fetchBotSetTitle(userMessage.text, convoId);
        } else {
          await setDoc(
            doc(db, "conversations", convoId),
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
        }

        const messagesRef = collection(
          db,
          "conversations",
          convoId,
          "messages"
        );
        await addDoc(messagesRef, {
          ...userMessage,
          createdAt: now,
        });

        fetchBotResponse(userMessage, convoId);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      fetchBotResponse(userMessage);
    }
  };

  return (
    <ConversationLayout>
      <MessagesLayout
        messages={messages}
        isFetchingResponse={isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
        emptyStateText="Hello, what can I help with?"
      />
      <MessageInput
        input={input}
        setInput={setInput}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ConversationLayout>
  );
};

export default Home;
