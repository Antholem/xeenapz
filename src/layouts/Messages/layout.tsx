import React, { Fragment, RefObject, useEffect } from "react";
import { FC } from "react";
import {
  Box,
  VStack,
  Text,
  Flex,
  Image,
  SkeletonCircle,
  Spinner,
  Divider,
} from "@chakra-ui/react";
import { User } from "@/lib/firebase";
import MessageItem from "../../components/MessageItem";
import { formatDateGrouping } from "@/utils/dateFormatter";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

interface MessagesLayoutProps {
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

const MessagesLayout: FC<MessagesLayoutProps> = ({
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
      messagesEndRef.current.scrollIntoView();
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
      {messages.length > 0 &&
        messages.map((currentMessage, index, array) => {
          const currentDate = formatDateGrouping(currentMessage.createdAt);
          const previousMessage = array[index - 1];
          const previousDate = previousMessage
            ? formatDateGrouping(previousMessage.createdAt)
            : null;

          const shouldShowDateSeparator =
            index === 0 || (currentDate && currentDate !== previousDate);

          return (
            <Fragment key={index}>
              {shouldShowDateSeparator && currentDate && (
                <Flex
                  key={`date-separator-${currentDate}-${index}`}
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                  gap={2}
                  my={2}
                >
                  <Divider orientation="horizontal" />
                  <Box>
                    <Text whiteSpace="nowrap" fontSize="xs">
                      {currentDate}
                    </Text>
                  </Box>
                  <Divider orientation="horizontal" />
                </Flex>
              )}
              <MessageItem
                message={currentMessage}
                user={user}
                speakText={speakText}
                playingMessage={playingMessage}
                setPlayingMessage={setPlayingMessage}
              />
            </Fragment>
          );
        })}
      {messages.length === 0 && (
        <VStack height="100%">
          <Flex justify="center" align="center" flex="1">
            <Text fontSize={{ base: "lg", md: "3xl" }} textAlign="center">
              {emptyStateText}
            </Text>
          </Flex>
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

export default MessagesLayout;
