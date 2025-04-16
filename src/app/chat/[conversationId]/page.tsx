"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, FC } from "react";
import {
  db,
  doc,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  DocumentReference,
} from "@/lib/firebase";
import { useAuth } from "@/app/context/Auth";
import ConversationLayout from "@/layouts/Conversation/layout";
import MessagesLayout from "@/layouts/Messages/layout";
import MessageInput from "@/components/MessageInput";
import { useSpeechRecognition } from "react-speech-recognition";
import { speakText } from "@/lib/textToSpeech";

interface ConversationParams {
  [key: string]: string | undefined;
  conversationId?: string;
}

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

const Conversation: FC = () => {
  const { conversationId } = useParams<ConversationParams>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState<string>("");
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    setErrorMessage(null);
    setMessages([]);

    const conversationDocRef: DocumentReference = doc(
      db,
      "conversations",
      conversationId as string
    );
    const unsubscribeConversation = onSnapshot(
      conversationDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setErrorMessage("Conversation not found!");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching conversation:", error);
        setErrorMessage("Failed to fetch conversation.");
        setLoading(false);
      }
    );

    const messagesCollectionRef = collection(
      db,
      "conversations",
      conversationId as string,
      "messages"
    );
    const messagesQuery = query(messagesCollectionRef, orderBy("createdAt"));
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = snapshot.docs.map(
          (doc) =>
            ({
              ...doc.data(),
            } as Message)
        );
        setMessages(messagesList);
      },
      (error) => {
        console.error("Error listening for messages:", error);
        setErrorMessage("Failed to fetch messages.");
      }
    );

    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId]);

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
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

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

      const messagesRef = collection(db, "conversations", convoId, "messages");
      await addDoc(messagesRef, {
        ...botMessage,
        createdAt: new Date().toISOString(),
        isGenerated: true,
      });

      await updateDoc(doc(db, "conversations", convoId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: botMessage.text,
          sender: botMessage.sender,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching bot response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !conversationId) return;

    const timestamp = Date.now();
    const userMessage: Message = { text: input, sender: "user", timestamp };

    setInput("");

    try {
      const messagesRef = collection(
        db,
        "conversations",
        conversationId as string,
        "messages"
      );
      await addDoc(messagesRef, {
        ...userMessage,
        createdAt: new Date().toISOString(),
        sender: "user",
      });

      const conversationDocRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationDocRef, {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: userMessage.text,
          sender: userMessage.sender,
          createdAt: new Date().toISOString(),
        },
      });

      fetchBotResponse(userMessage, conversationId as string);
    } catch (error) {
      console.error("Error sending message:", error);
      console.log(errorMessage);
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
        isLoading={loading}
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

export default Conversation;
