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
  useColorMode,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { format } from "date-fns";
import { IoStop } from "react-icons/io5";
import { useSpeechRecognition } from "react-speech-recognition";
import { speakText } from "@/lib/textToSpeech";
import { SpeechRecognize } from "@/lib/speechRecognition";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/app/context/Auth";
import {
  firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

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
  const { user } = useAuth();

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
  const fetchBotResponse = async (
    userMessage: Message,
    conversationId: string
  ) => {
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

      const botMessage: Message = {
        text: botResponse,
        sender: "bot",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save bot message to Firestore
      const conversationRef = doc(firestore, "conversations", conversationId);
      const messagesRef = collection(conversationRef, "messages");

      await setDoc(doc(messagesRef, `message_${botMessage.timestamp}`), {
        text: botResponse,
        sender: "bot",
        receiver: "user",
        createdAt: serverTimestamp(),
        messageType: "text",
        isRead: false,
        isDeleted: false,
      });

      // Update last message in conversation
      await updateDoc(conversationRef, {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: botResponse,
          sender: "bot",
          createdAt: serverTimestamp(),
        },
      });
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setIsFetchingResponse(false);
    }
  };

  // Send Message
  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const timestamp = Date.now();
    const userMessage: Message = { text: input, sender: "user", timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const conversationId = user.uid;
      const conversationRef = doc(firestore, "conversations", conversationId);

      // Save conversation details
      await setDoc(
        conversationRef,
        {
          userId: user.uid,
          title: conversationId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isArchived: false,
          lastMessage: {
            text: input,
            sender: "user",
            createdAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      // Save messages under the conversation
      const messagesRef = collection(conversationRef, "messages");
      await setDoc(doc(messagesRef, `message_${timestamp}`), {
        text: input,
        sender: "user",
        receiver: "bot",
        createdAt: serverTimestamp(),
        messageType: "text",
        isRead: true,
        isDeleted: false,
      });

      // Fetch bot response and save it
      fetchBotResponse(userMessage, conversationId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const saveMessageToFirestore = async (
    userMessage: Message,
    botMessage?: Message
  ) => {
    if (!user) return;
    const userId = user.uid;
    const conversationRef = collection(firestore, "conversations");

    // Check if there's an existing conversation
    const existingConvoSnap = await getDocs(conversationRef);
    let conversationId = existingConvoSnap.docs[0]?.id || uuidv4();
    let conversationDocRef = doc(conversationRef, conversationId);

    if (!existingConvoSnap.docs.length) {
      await setDoc(conversationDocRef, {
        userId,
        title: "New Conversation",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isArchived: false,
        lastMessage: null,
      });
    }

    // Save User Message
    const messagesCollectionRef = collection(conversationDocRef, "messages");
    const userMessageId = uuidv4();
    await setDoc(doc(messagesCollectionRef, userMessageId), {
      text: userMessage.text,
      sender: "user",
      receiver: "bot",
      createdAt: serverTimestamp(),
      messageType: "text",
      isRead: true,
      isDeleted: false,
    });

    if (botMessage) {
      const botMessageId = uuidv4();
      await setDoc(doc(messagesCollectionRef, botMessageId), {
        text: botMessage.text,
        sender: "bot",
        receiver: "user",
        createdAt: serverTimestamp(),
        messageType: "text",
        isRead: false,
        isDeleted: false,
      });

      // Update conversation metadata
      await updateDoc(conversationDocRef, {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: botMessage.text,
          sender: "bot",
          createdAt: serverTimestamp(),
        },
      });
    }
  };

  return (
    <Flex direction="column" h="100%">
      {/* Messages Container */}
      <Box flex="1" overflowY="auto" p={4} aria-live="polite">
        {messages.length === 0 ? (
          <VStack height="100%">
            <Flex justify="center" align="center" flex="1">
              <Text fontSize={{ base: "lg", md: "3xl" }} textAlign="center">
                Hello, what can I help with?
              </Text>
            </Flex>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
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
          </VStack>
        )}

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
        <Box as="div" ref={messagesEndRef} />
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
              variant="ghost"
              icon={isListening ? <IoStop /> : <IoIosMic />}
              onClick={() => SpeechRecognize(isListening, resetTranscript)}
            />
          </Tooltip>
          <Tooltip label="Send message">
            <IconButton
              aria-label="Send Message"
              variant="ghost"
              icon={<IoMdSend />}
              isDisabled={isFetchingResponse || !input.trim()}
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
  const { colorMode } = useColorMode();
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
            color={isUser ? "white" : ""}
            bg={
              isUser
                ? colorMode === "light"
                  ? "blue.400"
                  : "blue.500"
                : colorMode === "light"
                ? "gray.200"
                : "gray.700"
            }
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
