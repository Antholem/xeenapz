"use client";

import { useState, useEffect, useRef, FC } from "react";
import { Divider } from "@chakra-ui/react";
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
import { ChatInput, MessagesContainer } from "@/components/";
import { ChatLayout } from "@/layouts";

// Message Type
interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleBeforeUnload = () => speechSynthesis.cancel();

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      speechSynthesis.cancel();
    };
  }, []);

  // Fetch Bot Response
  const fetchBotResponse = async (userMessage: Message, convoId: string) => {
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
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsFetchingResponse(false);

      // Save bot message to Firestore
      const messagesRef = collection(db, "conversations", convoId, "messages");

      await addDoc(messagesRef, {
        ...botMessage,
        createdAt: new Date().toISOString(),
        isGenerated: true,
      });

      // Optional: update conversation metadata
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
  };

  // Send Message
  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const timestamp = Date.now();
    const userMessage: Message = { text: input, sender: "user", timestamp };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");

    try {
      let convoId = conversationId;

      if (!convoId) {
        // Create a new conversation
        convoId = uuidv4();
        setConversationId(convoId);

        await setDoc(doc(db, "conversations", convoId), {
          userId: user.uid,
          title: "New Chat",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isArchived: false,
          lastMessage: {
            text: userMessage.text,
            sender: userMessage.sender,
            createdAt: new Date().toISOString(),
          },
        });
      }

      // Save user message
      const messagesRef = collection(db, "conversations", convoId, "messages");

      await addDoc(messagesRef, {
        ...userMessage,
        createdAt: new Date().toISOString(),
      });

      // Now fetch the bot response and save it
      fetchBotResponse(userMessage, convoId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <ChatLayout>
      {/* Messages Container */}
      <MessagesContainer
        messages={messages}
        isFetchingResponse={isFetchingResponse}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
      />

      <Divider />

      {/* Input Area */}
      <ChatInput
        input={input}
        setInput={setInput}
        isListening={isListening}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ChatLayout>
  );
};

export default Home;
