"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Button, Box, VStack, Text, Flex, useColorMode, useTheme } from "@chakra-ui/react";

const Home = () => {
  const { colorMode } = useColorMode();
  const theme = useTheme();
  const bgColor = theme.styles.global({ colorMode }).body.bg;
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
            <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
              {msg.sender === "user" ? "You: " : "Bot: "}
              {msg.text}
            </Text>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box 
        p={4}
        borderTop="1px solid"
        borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
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
