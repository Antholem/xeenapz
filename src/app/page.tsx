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
  Divider,
  IconButton,
  Card,
  Tooltip,
  SkeletonCircle,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { format } from "date-fns";
import { IoStop } from "react-icons/io5";
import { useSpeechRecognition } from "react-speech-recognition";
import { speakText } from "@/lib/textToSpeech";
import { SpeechRecognize } from "@/lib/speechRecognition";
import ReactMarkdown from "react-markdown";
import { useAuth } from "./context/AuthContext";

// Message Type
interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

const Home: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false);
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const prevTranscriptRef = useRef("");
  const { user, loading } = useAuth();

  if (loading) return null;

  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.replace(prevTranscriptRef.current, "").trim();
      setInput((prev) => (prev ? `${prev} ${newText}`.trim() : newText));
      prevTranscriptRef.current = transcript;
    }
  }, [transcript]);

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

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

  // Fetch Bot Response
  const fetchBotResponse = async (userMessage: Message) => {
    setIsFetchingResponse(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      setMessages((prev) => [
        ...prev,
        { text: botResponse, sender: "bot", timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Error fetching response",
          sender: "bot",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsFetchingResponse(false);
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
        <VStack spacing={4} align="stretch" height="100%">
          {/* Show "Hello World" when there are no messages */}
          {messages.length === 0 && (
            <Flex justify="center" align="center" height="100%">
              <Text fontSize={{ base: "lg", md: "3xl" }} textAlign="center">
                Hello, What can I help with?
              </Text>
            </Flex>
          )}

          {messages.map((msg, index) => (
            <MessageItem
              key={index}
              message={msg}
              user={user}
              speakText={speakText}
              playingMessage={playingMessage}
              setPlayingMessage={setPlayingMessage}
            />
          ))}

          {isFetchingResponse && (
            <Flex justify="flex-start" align="end" gap={4}>
              <Image boxSize="24px" src="./favicon.ico" alt="Xeenapz" />
              <Flex direction="row" gap={1}>
                {[...Array(3)].map((_, index) => (
                  <SkeletonCircle key={index} size="2" />
                ))}
              </Flex>
            </Flex>
          )}
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
          <Tooltip label={isListening ? "Stop" : "Type by voice"}>
            <IconButton
              aria-label="Speech Recognition"
              icon={isListening ? <IoStop /> : <IoIosMic />}
              colorScheme={isListening ? "red" : "blue"}
              onClick={() => SpeechRecognize(isListening, resetTranscript)}
            />
          </Tooltip>
          <Tooltip label="Send message">
            <IconButton
              aria-label="Send Message"
              icon={<IoMdSend />}
              isDisabled={isFetchingResponse || !input.trim()}
              colorScheme="blue"
              onClick={sendMessage}
            />
          </Tooltip>
        </Flex>
      </Card>
    </Flex>
  );
};

// Message Component
const MessageItem: FC<{
  message: Message;
  user: User | null;
  speakText: (
    text: string,
    playingMessage: string | null,
    setPlayingMessage: (msg: string | null) => void
  ) => void;
  setPlayingMessage: (msg: string | null) => void;
  playingMessage: string | null;
}> = ({ message, user, speakText, playingMessage, setPlayingMessage }) => {
  const isUser = message.sender === "user";
  const formattedTime = format(new Date(message.timestamp), "hh:mm a");

  return (
    <Flex
      direction="column"
      align={isUser ? "flex-end" : "flex-start"}
      overflowX="hidden"
    >
      <Flex align="start" gap={4} maxW="70%">
        {!isUser && <Image boxSize="24px" src="./favicon.ico" alt="Bot Icon" />}
        <Box
          display="flex"
          flexDirection="column"
          alignItems={isUser ? "flex-end" : "flex-start"}
          gap={1}
        >
          <Box
            p={3}
            borderRadius="lg"
            bg={isUser ? "blue.500" : "gray.600"}
            color="white"
            maxW="max-content"
            whiteSpace="pre-wrap"
          >
            <ReactMarkdown
              components={{
                ul: ({ children }) => (
                  <ul style={{ paddingLeft: "20px" }}>{children}</ul>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </Box>

          <Flex align="center" justify="center" gap={1}>
            <Text fontSize="xs">{formattedTime}</Text>
            {!isUser && (
              <Tooltip
                label={playingMessage === message.text ? "Stop" : "Read aloud"}
              >
                <IconButton
                  aria-label="Read aloud"
                  icon={
                    playingMessage === message.text ? <IoStop /> : <IoIosMic />
                  }
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    speakText(message.text, playingMessage, setPlayingMessage)
                  }
                />
              </Tooltip>
            )}
          </Flex>
        </Box>
        {isUser && (
          <Avatar
            size="sm"
            src={user?.photoURL ?? "default-avatar.png"}
            name={user?.displayName ?? ""}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default Home;
