import React, { RefObject, useEffect } from "react";
import { FC } from "react";
import {
  Box,
  VStack,
  Text,
  Flex,
  Image,
  SkeletonCircle,
  Spinner,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import MessageItem from "../MessageItem";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

interface MessagesContainerProps {
  messages: Message[];
  isFetchingResponse: boolean;
  user: User | null;
  speakText: (
    text: string,
    playingMessage: string | null,
    setPlayingMessage: (msg: string | null) => void
  ) => void;
  setPlayingMessage: (msg: string | null) => void;
  playingMessage: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  isLoading?: boolean;
  emptyStateText?: string;
}

const MessagesContainer: FC<MessagesContainerProps> = ({
  messages,
  isFetchingResponse,
  user,
  speakText,
  playingMessage,
  setPlayingMessage,
  messagesEndRef,
  isLoading = false,
  emptyStateText = "",
}) => {
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesEndRef]);

  return isLoading ? (
    <Flex
      flex="1"
      overflowY="auto"
      p={4}
      aria-live="polite"
      justifyContent="center"
      alignItems="center"
    >
      <Spinner size="xl" />
    </Flex>
  ) : (
    <Box flex="1" overflowY="auto" p={4} aria-live="polite">
      {messages.length === 0 ? (
        <VStack height="100%">
          <Flex justify="center" align="center" flex="1">
            <Text fontSize={{ base: "lg", md: "3xl" }} textAlign="center">
              {emptyStateText}
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
          <Image boxSize="24px" src="/favicon.ico" alt="Xeenapz" />
          <Flex direction="row" gap={1}>
            {[...Array(3)].map((_, index) => (
              <SkeletonCircle key={index} size="2" />
            ))}
          </Flex>
        </Flex>
      )}
      <Box as="div" ref={messagesEndRef} />
    </Box>
  );
};

export default MessagesContainer;
