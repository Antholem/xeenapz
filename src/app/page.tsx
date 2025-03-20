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
import { format } from "date-fns";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
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

    const timestamp = Date.now();
    const userMessage: Message = { text: input, sender: "user", timestamp };
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
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response", sender: "bot", timestamp: Date.now() }]);
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

const MessageItem: FC<{ message: Message; user: User | null }> = ({ message, user }) => {
  return (
    <Flex direction="column" align={message.sender === "user" ? "flex-end" : "flex-start"}>
      <Flex align="start" gap={4} maxW="70%">
        {message.sender === "bot" && <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />}

        <Box display="flex" flexDirection="column" alignItems={message.sender === "user" ? "flex-end" : "flex-start"}>
          <Box
            p={3}
            borderRadius="lg"
            bg={message.sender === "user" ? "blue.500" : "gray.600"}
            color="white"
            maxW="max-content"
            whiteSpace="pre-wrap"
          >
            <Text>{message.text}</Text>
          </Box>
          <Text fontSize="xs" mt={1} textAlign={message.sender === "user" ? "right" : "left"}>
            {format(new Date(message.timestamp), "hh:mm a")}
          </Text>
        </Box>

        {message.sender === "user" && (
          <Avatar size="sm" src={user?.photoURL ?? "/broken-avatar.png"} name={user?.displayName ?? "User"} />
        )}
      </Flex>
    </Flex>
  );
};

const SkeletonLoader: FC = () => {
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
