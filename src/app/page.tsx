"use client";

import { useState, useEffect, useRef, FC } from "react";
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
import { v4 as uuidv4 } from "uuid";
import { MessageInput } from "@/components";
import { ConversationLayout, MessagesLayout } from "@/layouts";
import { usePathname } from "next/navigation";
import useTempChat from "@/stores/useTempChat";
import useAuth from "@/stores/useAuth";
import useMessagePersistent from "@/stores/useMessagePersistent";
import useMessageInputPersistent from "@/stores/useMessageInputPersistent";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

const Home: FC = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { getInput, setInput } = useMessageInputPersistent();
  const input = getInput("home");
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");
  const { user } = useAuth();
  const { isMessageTemporary } = useTempChat();
  const pathname = usePathname();
  const hasMounted = useRef(false);

  const { setMessages: setGlobalMessages, addMessageToBottom } =
    useMessagePersistent();

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
    convoId?: string | null
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

      if (user && convoId && !isMessageTemporary) {
        addMessageToBottom(convoId, botMessage);

        const messagesRef = collection(
          db,
          "conversations",
          convoId,
          "messages"
        );
        await addDoc(messagesRef, {
          ...botMessage,
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

  const fetchBotSetTitle = async (userMessageText: string, convoId: string) => {
    try {
      const titlePrompt = `Generate a short, descriptive title/subject/topic (only the title, no extra words) for the following chat message: "${userMessageText}"`;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: titlePrompt }),
      });

      const data = await res.json();
      const newTitle = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (newTitle) {
        await setDoc(
          doc(db, "conversations", convoId),
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

          window.history.pushState({}, "", `/chat/${convoId}`);

          setGlobalMessages(convoId, [userMessage]);
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

          addMessageToBottom(convoId, userMessage);
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
      />
      <MessageInput
        input={input}
        setInput={(val) => setInput("home", val)}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ConversationLayout>
  );
};

export default Home;
