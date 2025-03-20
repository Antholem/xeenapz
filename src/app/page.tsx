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
  useColorMode, 
  useTheme, 
  IconButton
} from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { IoMdSend } from "react-icons/io";

// Define a type for message
interface Message {
  text: string;
  sender: "user" | "bot";
};

const Home: FC = () => {
  const { colorMode } = useColorMode();
  const theme = useTheme();
  const bgColor = theme.styles.global({ colorMode }).body.bg;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage: Message = {
        text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response", sender: "bot" }]);
    } finally {
      setLoading(false);
    };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <Flex direction="column" h="100%">
      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <MessageItem key={index} message={msg} user={user} />
          ))}

          {loading && <SkeletonLoader />}

          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Divider orientation="horizontal" />

      <Box p={3} bg={bgColor}>
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
              isDisabled={loading}
              colorScheme="blue"
              onClick={sendMessage}
          />
        </Flex>
      </Box>
    </Flex>
  );
};

const MessageItem: React.FC<{ message: Message; user: User | null }> = ({ message, user }) => {
  return (
    <Flex justify={message.sender === "user" ? "flex-end" : "flex-start"} align="start" gap={4}>
      {message.sender === "bot" && <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />}
      <Box p={3} borderRadius="lg" maxW="70%" bg={message.sender === "user" ? "blue.500" : "gray.600"} color="white">
        <Text>{message.text}</Text>
      </Box>
      {message.sender === "user" && (
        <Avatar size="sm" src={user?.photoURL ?? "/broken-avatar.png"} name={user?.displayName ?? "User"} />
      )}
    </Flex>
  );
};

const SkeletonLoader: React.FC = () => {
  return (
    <Flex justify="flex-start" align="center" gap={4} w="50%">
      <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />
      <Box flex="1">
        <Skeleton height="30px" borderRadius="lg" />
      </Box>
    </Flex>
  );
};

export default Home;
