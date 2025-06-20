"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, FC } from "react";
import { useSpeechRecognition } from "react-speech-recognition";
import {
  db,
  doc,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  DocumentReference,
  onSnapshot,
} from "@/lib/firebase";
import {
  DocumentData,
  endBefore,
  limit,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { MessagesLayout, ConversationLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { speakText } from "@/lib/textToSpeech";
import useAuth from "@/stores/useAuth";
import useMessagePersistent, { Message } from "@/stores/useMessagePersistent";
import useMessageInputPersistent from "@/stores/useMessageInputPersistent";

interface ConversationParams {
  [key: string]: string | undefined;
  conversationId?: string;
}

const Conversation: FC = () => {
  const { conversationId } = useParams<ConversationParams>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    messagesByConversation,
    setMessages,
    addMessagesToTop,
    addMessageToBottom,
  } = useMessagePersistent();

  const storedMessages = messagesByConversation[conversationId || ""] || [];

  const [loadingMessages, setLoadingMessages] = useState(true);
  const { getInput, setInput } = useMessageInputPersistent();
  const input = getInput(conversationId || "home");
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");

  const [oldestDoc, setOldestDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!conversationId || !user || storedMessages.length > 0) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    setOldestDoc(null);
    setHasMore(true);

    const conversationDocRef: DocumentReference = doc(
      db,
      "conversations",
      conversationId
    );

    const unsubscribeConversation = onSnapshot(
      conversationDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          notFound();
        }
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Error fetching conversation:", error);
        setLoadingMessages(false);
      }
    );

    const messagesCollectionRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const messagesQuery = query(messagesCollectionRef, orderBy("createdAt"));

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = snapshot.docs.map(
          (doc) => ({ ...doc.data() } as Message)
        );

        setMessages(conversationId, messagesList);
        if (snapshot.docs.length > 0) {
          setOldestDoc(snapshot.docs[0]);
        }
      },
      (error) => {
        console.error("Error listening for messages:", error);
      }
    );

    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId, user, storedMessages.length, setMessages]);

  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.replace(prevTranscriptRef.current, "").trim();
      setInput(conversationId || "home", (prev) =>
        prev ? `${prev} ${newText}`.trim() : newText
      );
      prevTranscriptRef.current = transcript;
    }
  }, [transcript, conversationId, setInput]);

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  const fetchOlderMessages = async (): Promise<Message[]> => {
    if (!conversationId || !hasMore || !oldestDoc) return [];

    try {
      const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
      );

      const baseQuery = query(
        messagesRef,
        orderBy("createdAt", "asc"),
        endBefore(oldestDoc),
        limit(20)
      );

      const snapshot = await getDocs(baseQuery);

      if (snapshot.empty) {
        setHasMore(false);
        return [];
      }

      const olderMessages: Message[] = snapshot.docs.map(
        (doc) => doc.data() as Message
      );

      setOldestDoc(snapshot.docs[0]);
      return olderMessages;
    } catch (err) {
      console.error("Error fetching older messages:", err);
      return [];
    }
  };

  const handleLoadMessages = async () => {
    const olderMessages = await fetchOlderMessages();
    addMessagesToTop(conversationId!, olderMessages);
  };

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
        createdAt: new Date().toISOString(),
      };

      addMessageToBottom(convoId, botMessage);

      const messagesRef = collection(db, "conversations", convoId, "messages");
      await addDoc(messagesRef, {
        ...botMessage,
        isGenerated: true,
      });

      await updateDoc(doc(db, "conversations", convoId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: botMessage.text,
          sender: botMessage.sender,
          createdAt: botMessage.createdAt,
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
    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt: new Date().toISOString(),
    };

    setInput(conversationId, "");
    addMessageToBottom(conversationId, userMessage);

    try {
      const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
      );
      await addDoc(messagesRef, userMessage);
      await updateDoc(doc(db, "conversations", conversationId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: userMessage.text,
          sender: userMessage.sender,
          createdAt: userMessage.createdAt,
        },
      });

      fetchBotResponse(userMessage, conversationId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return null;

  return (
    <ConversationLayout>
      <MessagesLayout
        messages={user ? storedMessages : []}
        isFetchingResponse={user ? isFetchingResponse : false}
        user={user}
        speakText={speakText}
        playingMessage={playingMessage}
        setPlayingMessage={setPlayingMessage}
        messagesEndRef={messagesEndRef}
        onLoadMore={handleLoadMessages}
        isLoading={loadingMessages}
      />
      <MessageInput
        input={user ? input : ""}
        setInput={(val) => setInput(conversationId || "home", val)}
        isListening={user ? isListening : false}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ConversationLayout>
  );
};

export default Conversation;
