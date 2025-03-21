"use client";

import { useState, useEffect, useRef, FC } from "react";
import { 
  Input, 
  Box, 
  VStack, 
  Text, 
  Flex, 
  Avatar, 
  Image, 
  Skeleton, 
  Divider,
  useColorModeValue, 
  IconButton,
  Card
} from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { IoMdSend } from "react-icons/io";
import { format } from "date-fns";

// Message Type
interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

const Home: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue("gray.100", "gray.800");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch Bot Response
  const fetchBotResponse = async (userMessage: Message) => {
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();
      const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      setMessages((prev) => [
        ...prev,
        { text: botResponse, sender: "bot", timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error fetching response", sender: "bot", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Send Message
  const sendMessage = () => {
    if (!input.trim()) return;

    const timestamp = Date.now();
    const userMessage: Message = { text: input, sender: "user", timestamp };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    fetchBotResponse(userMessage);
  };

  return (
    <Flex direction="column" h="100%">
      {/* Messages Container */}
      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <MessageItem key={index} message={msg} user={user} />
          ))}
          {loading && <SkeletonLoader />}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Divider />

      {/* Input Area */}
      <Card p={3} borderRadius={0} variant="unstyled">
        <Flex>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Write a message..."
            flex="1"
            variant="filled"
          />
          <IconButton
            ml={2}
            aria-label="Send Message"
            icon={<IoMdSend />}
            isDisabled={loading || !input.trim()}
            colorScheme="blue"
            onClick={sendMessage}
          />
        </Flex>
      </Card>
    </Flex>
  );
};

// Message Component
const MessageItem: FC<{ message: Message; user: User | null }> = ({ message, user }) => {
  const isUser = message.sender === "user";
  const formattedTime = format(new Date(message.timestamp), "hh:mm a");

  return (
    <Flex direction="column" align={isUser ? "flex-end" : "flex-start"}>
      <Flex align="start" gap={4} maxW="70%">
        {!isUser && <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />}
        <Box display="flex" flexDirection="column" alignItems={isUser ? "flex-end" : "flex-start"}>
          <Box
            p={3}
            borderRadius="lg"
            bg={isUser ? "blue.500" : "gray.600"}
            color="white"
            maxW="max-content"
            whiteSpace="pre-wrap"
          >
            <Text>{message.text}</Text>
          </Box>
          <Text fontSize="xs" mt={1} textAlign={isUser ? "right" : "left"}>
            {formattedTime}
          </Text>
        </Box>
        {isUser && (
          <Avatar size="sm" src={user?.photoURL ?? "/broken-avatar.png"} name={user?.displayName ?? "User"} />
        )}
      </Flex>
    </Flex>
  );
};

// Loading Skeleton Component
const SkeletonLoader: FC = () => (
  <Flex justify="flex-start" align="center" gap={4} w="50%">
    <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />
    <Box flex="1">
      <Skeleton height="30px" borderRadius="lg" />
    </Box>
  </Flex>
);

export default Home;
