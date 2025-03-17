"use client";

import { useState } from "react";
import { Input, Button, Box, VStack, Text } from "@chakra-ui/react";

function Home() {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");

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
        sender: "bot" 
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response", sender: "bot" }]);
    }

    setInput("");
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box>
      <VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box><VStack spacing={4} align="stretch">
        {messages.map((msg, index) => (
          <Text key={index} color={msg.sender === "user" ? "blue.500" : "green.500"}>
            {msg.sender === "user" ? "You: " : "Bot: "}
            {msg.text}
          </Text>
        ))}
      </VStack>

      <Box display="flex" mt={4}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button ml={2} onClick={sendMessage} colorScheme="blue">
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
