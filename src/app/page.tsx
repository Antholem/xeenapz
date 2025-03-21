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
  IconButton,
  Card
} from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { format } from "date-fns";
import { IoStop } from "react-icons/io5";

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
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleBeforeUnload = () => speechSynthesis.cancel();

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      speechSynthesis.cancel();
    };
  }, []);

  // Text-to-Speech (TTS) Function
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      // Stop the current speech before playing a new one
      speechSynthesis.cancel();

      if (playingMessage === text) {
        // If the same message is playing, stop it
        setPlayingMessage(null);
      } else {
        // Start playing the new message
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingMessage(null);
        speechSynthesis.speak(utterance);
        setPlayingMessage(text);
      }
    } else {
      console.error("Text-to-Speech is not supported in this browser.");
    }
  };

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
      <Box flex="1" overflowY="auto" p={4} aria-live="polite">
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <MessageItem 
              key={index} 
              message={msg} 
              user={user} 
              speakText={speakText} 
              playingMessage={playingMessage}
            />
          ))}
          {loading && <SkeletonLoader />}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Divider />

      {/* Input Area */}
      <Card p={3} borderRadius={0} variant="unstyled">
        <Flex gap={2} justify="center" align="center">
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
            aria-label="Text to speech"
            icon={<IoIosMic />}
            colorScheme="blue"
            onClick={sendMessage}
          />
          <IconButton
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
const MessageItem: FC<{ 
  message: Message; 
  user: User | null; 
  speakText: (text: string) => void; 
  playingMessage: string | null 
}> = ({ message, user, speakText, playingMessage }) => {
  const isUser = message.sender === "user";
  const formattedTime = format(new Date(message.timestamp), "hh:mm a");

  return (
    <Flex direction="column" align={isUser ? "flex-end" : "flex-start"}>
      <Flex align="start" gap={4} maxW="70%">
        {!isUser && <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />}
        <Box display="flex" flexDirection="column" alignItems={isUser ? "flex-end" : "flex-start"} gap={1}>
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
          <Flex align="center" justify="center" gap={1}>
            <Text fontSize="xs">{formattedTime}</Text>
            {!isUser && (
              <IconButton
                aria-label="Speak message"
                icon={playingMessage === message.text ? <IoStop /> : <IoIosMic />}
                variant="ghost"
                size="xs"
                onClick={() => speakText(message.text)}
              />
            )}
          </Flex>
        </Box>
        {isUser && (
          <Avatar size="sm" src={user?.photoURL ?? "default-avatar.png"} name={user?.displayName ?? ""} />
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
