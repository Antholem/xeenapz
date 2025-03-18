"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Input, Button, Box, VStack, Text, Flex, Avatar, 
  useColorMode, useTheme, 
  Image,
  Divider
} from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const Home = () => {
  const { colorMode } = useColorMode();
  const theme = useTheme();
  const bgColor = theme.styles.global({ colorMode }).body.bg;
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage = {
        text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response", sender: "bot" }]);
    }

    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Flex direction="column" h="100%">
      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <Flex
              key={index}
              justify={msg.sender === "user" ? "flex-end" : "flex-start"}
              align="center"
              gap={4}
            >
              {msg.sender === "bot" && (
                <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />
              )}
              <Box
                p={3}
                borderRadius="lg"
                maxW="70%"
                bg={msg.sender === "user" ? "blue.500" : "gray.600"}
                color="white"
              >
                <Text>{msg.text}</Text>
              </Box>
              {msg.sender === "user" && (
                <Avatar 
                  size="sm" 
                  src={user?.photoURL ?? "/broken-avatar.png"} 
                  name={user?.displayName ?? "User"} 
                />
              )}
            </Flex>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      <Divider orientation="horizontal" />
      <Box 
        p={4}
        bg={bgColor}
      >
        <Flex>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Xeenapz"
            flex="1"
          />
          <Button ml={2} onClick={sendMessage} colorScheme="blue">
            Send
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Home;
