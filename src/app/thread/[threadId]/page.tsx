"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, FC } from "react";
import { useSpeechRecognition } from "react-speech-recognition";
import { useAuth, useThreadInput, useThreadMessages, Message } from "@/stores";
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
  DocumentData,
  endBefore,
  limit,
  QueryDocumentSnapshot,
  speakText,
} from "@/lib";
import { MessagesLayout, ThreadLayout } from "@/layouts";
import { MessageInput } from "@/components";

interface ThreadParams {
  [key: string]: string | undefined;
  threadId?: string;
}

const Thread: FC = () => {
  const { threadId } = useParams<ThreadParams>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    messagesByThread,
    setMessages,
    addMessagesToTop,
    addMessageToBottom,
  } = useThreadMessages();

  const storedMessages = messagesByThread[threadId || ""] || [];

  const [loadingMessages, setLoadingMessages] = useState(true);
  const { getInput, setInput } = useThreadInput();
  const input = getInput(threadId || "home");
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
    if (!threadId || !user || storedMessages.length > 0) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    setOldestDoc(null);
    setHasMore(true);

    const threadDocRef: DocumentReference = doc(db, "threads", threadId);

    const unsubscribeThread = onSnapshot(
      threadDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          notFound();
        }
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Error fetching thread:", error);
        setLoadingMessages(false);
      }
    );

    const messagesCollectionRef = collection(
      db,
      "threads",
      threadId,
      "messages"
    );

    const messagesQuery = query(messagesCollectionRef, orderBy("createdAt"));

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = snapshot.docs.map(
          (doc) => ({ ...doc.data() } as Message)
        );

        setMessages(threadId, messagesList);
        if (snapshot.docs.length > 0) {
          setOldestDoc(snapshot.docs[0]);
        }
      },
      (error) => {
        console.error("Error listening for messages:", error);
      }
    );

    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [threadId, user, storedMessages.length, setMessages]);

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

  const fetchOlderMessages = async (): Promise<Message[]> => {
    if (!threadId || !hasMore || !oldestDoc) return [];

    try {
      const messagesRef = collection(db, "threads", threadId, "messages");

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
    addMessagesToTop(threadId!, olderMessages);
  };

  const fetchBotResponse = async (userMessage: Message, id: string) => {
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

      addMessageToBottom(id, botMessage);

      const messagesRef = collection(db, "threads", id, "messages");
      await addDoc(messagesRef, {
        ...botMessage,
        isGenerated: true,
      });

      await updateDoc(doc(db, "threads", id), {
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
    if (!input.trim() || !user || !threadId) return;

    const timestamp = Date.now();
    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp,
      createdAt: new Date().toISOString(),
    };

    setInput(threadId, "");
    addMessageToBottom(threadId, userMessage);

    try {
      const messagesRef = collection(db, "threads", threadId, "messages");
      await addDoc(messagesRef, userMessage);
      await updateDoc(doc(db, "threads", threadId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: userMessage.text,
          sender: userMessage.sender,
          createdAt: userMessage.createdAt,
        },
      });

      fetchBotResponse(userMessage, threadId);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return null;

  return (
    <ThreadLayout>
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
        setInput={(val) => setInput(threadId || "home", val)}
        isListening={user ? isListening : false}
        resetTranscript={resetTranscript}
        isFetchingResponse={isFetchingResponse}
        sendMessage={sendMessage}
      />
    </ThreadLayout>
  );
};

export default Thread;
