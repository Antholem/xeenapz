"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { firestore as db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const ConversationPage = () => {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const [messages, setMessages] = useState<
    { id: string; text: string; sender: string }[]
  >([]);

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; text: string; sender: string }[];
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Conversation ID: {conversationId}</h1>
      <div className="mt-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id} className="p-2 border rounded-md">
              <p className="text-sm">
                <strong>{message.sender}:</strong> {message.text}
              </p>
            </div>
          ))
        ) : (
          <p>No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default ConversationPage;
