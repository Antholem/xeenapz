"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "@/lib/firebase";
import { Box, Text } from "@chakra-ui/react";

interface ConversationData {
  title?: string;
}

interface Message {
  createdAt: string;
  sender: string;
  text: string;
  timestamp: number;
}

const ConversationPage = () => {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState<ConversationData | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversationAndMessages = async () => {
      if (!conversationId) return;
      setLoading(true);
      setError(null);
      setConversation(null);
      setMessages([]);

      try {
        // Fetch the conversation document
        const conversationDocRef = doc(
          db,
          "conversations",
          conversationId as string
        );
        const conversationSnap = await getDoc(conversationDocRef);
        if (conversationSnap.exists()) {
          setConversation(conversationSnap.data() as ConversationData);

          // Fetch messages subcollection
          const messagesCollectionRef = collection(
            db,
            "conversations",
            conversationId as string,
            "messages"
          );
          const messagesQuery = query(
            messagesCollectionRef,
            orderBy("createdAt")
          ); // Or "timestamp", adjust based on your ordering
          const messagesSnap = await getDocs(messagesQuery);
          const messagesList: Message[] = [];
          messagesSnap.forEach((doc) => {
            messagesList.push(doc.data() as Message);
          });
          setMessages(messagesList);
        } else {
          setError("Conversation not found!");
        }
      } catch (e: unknown) {
        let errorMessage = "An unexpected error occurred.";
        if (e instanceof Error) {
          errorMessage = `Failed to fetch conversation and messages: ${e.message}`;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationAndMessages();
  }, [conversationId]);

  if (loading) {
    return <Box>Loading conversation...</Box>;
  }

  if (error) {
    return <Box color="red">{error}</Box>;
  }

  if (!conversation) {
    return <Box>Select a conversation.</Box>;
  }

  return (
    <Box p={4}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        {conversation.title || conversationId}
      </Text>
      {messages.length > 0 ? (
        messages.map((message) => (
          <Box key={message.timestamp} mb={2}>
            {" "}
            {/* Assuming 'timestamp' is unique enough, otherwise use doc.id if available */}
            <Text fontWeight={message.sender === "user" ? "bold" : "medium"}>
              {message.sender}: {message.text}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(message.createdAt).toLocaleString()}{" "}
              {/* Adjust if using Firebase Timestamp */}
            </Text>
          </Box>
        ))
      ) : (
        <Text>No messages in this conversation yet.</Text>
      )}
      {/* Add your chat input area here */}
    </Box>
  );
};

export default ConversationPage;
