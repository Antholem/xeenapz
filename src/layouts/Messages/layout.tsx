"use client";

import {
  FC,
  memo,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  RefObject,
} from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import {
  Box,
  Flex,
  Text,
  Image,
  VStack,
  Divider,
  SkeletonCircle,
  IconButton,
} from "@chakra-ui/react";
import { IoMdArrowDown } from "react-icons/io";
import { useAuth, useAccentColor } from "@/stores";
import { MessageItem } from "@/components";
import { formatDateGrouping } from "@/utils/dateFormatter";
import { Spinner, Progress } from "@themed-components";

interface Message {
  id?: string;
  text: string | null;
  sender: "user" | "bot";
  timestamp: number;
  created_at?: string;
  image?: {
    id: string;
    path: string;
    url: string;
  } | null;
}

interface MessagesLayoutProps {
  messages: Message[];
  isFetchingResponse: boolean;
  user: { id: string } | null;
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
  onLoadMore?: () => Promise<void>;
  onRetryMessage?: (message: Message) => void;
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
  emptyStateText = "Hello, what can I help with?",
  onLoadMore,
  onRetryMessage,
}) => {
  const { user: authUser } = useAuth();
  const { accentColor } = useAccentColor();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [readyToRender, setReadyToRender] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const initialLoad = useRef(false);

  const lastMessage = messages[messages.length - 1];

  const virtualMessages = useMemo(() => {
    const result: Array<{
      type: "separator" | "message" | "loader";
      value?: any;
    }> = [];

    let lastDate: string | null = null;

    messages.forEach((msg) => {
      const date = msg.created_at ?? new Date(msg.timestamp).toISOString();
      const formatted = formatDateGrouping(date);

      if (authUser && formatted !== lastDate) {
        result.push({ type: "separator", value: formatted });
        lastDate = formatted;
      }

      result.push({ type: "message", value: msg });
    });

    if (isFetchingResponse) {
      result.push({ type: "loader" });
    }

    return result;
  }, [messages, isFetchingResponse, authUser]);

  useEffect(() => {
    if (!readyToRender && virtualMessages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          virtuosoRef.current?.scrollToIndex({
            index: virtualMessages.length - 1,
            behavior: "auto",
            offset: 1000000,
          });
          setTimeout(() => setReadyToRender(true), 300);
        });
      });
    }
  }, [virtualMessages.length, readyToRender]);

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: virtualMessages.length - 1,
      behavior: "smooth",
      offset: 1000000,
    });
  }, [virtualMessages.length]);

  useEffect(() => {
    if (readyToRender && lastMessage?.sender === "user") {
      scrollToBottom();
    }
  }, [virtualMessages.length, readyToRender, lastMessage?.sender, scrollToBottom]);

  // Load more messages on first render to display the progress indicator
  // even before the user starts scrolling.
  useEffect(() => {
    if (!initialLoad.current && onLoadMore) {
      initialLoad.current = true;
      setIsLoadingMore(true);
      onLoadMore()
        .catch((err) =>
          console.error("Error loading older messages:", err)
        )
        .finally(() => setIsLoadingMore(false));
    }
  }, [onLoadMore]);

  const handleStartReached = useCallback(async () => {
    if (!hasScrolledOnce) {
      setHasScrolledOnce(true);
      return;
    }

    if (onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } catch (err) {
        console.error("Error loading older messages:", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasScrolledOnce, onLoadMore, isLoadingMore]);

  const handleAtBottomStateChange = useCallback(
    (atBottom: boolean) => {
      if (!readyToRender || messages.length === 0) {
        setShowScrollButton(false);
        return;
      }
      setShowScrollButton(!atBottom);
    },
    [readyToRender, messages.length]
  );

  if (isLoading && messages.length === 0) {
    return (
      <Flex flex="1" p={4} justify="center" alignItems="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box flex="1" overflow="hidden" position="relative">
      {messages.length === 0 ? (
        <VStack height="100%">
          <Flex flex="1" justify="center" align="center">
            <Text fontSize={{ base: "lg", md: "3xl" }} textAlign="center">
              {emptyStateText}
            </Text>
          </Flex>
        </VStack>
      ) : (
        <Box
          h="100%"
          overflow={readyToRender ? "auto" : "hidden"}
          visibility={readyToRender ? "visible" : "hidden"}
        >
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%", minHeight: 100 }}
            data={virtualMessages}
            followOutput="auto"
            increaseViewportBy={200}
            startReached={handleStartReached}
            atBottomStateChange={handleAtBottomStateChange}
            components={{
              Header: () =>
                isLoadingMore ? <Progress size="xs" isIndeterminate /> : null,
            }}
            itemContent={(index, item) => {
              const isFirst = index === 0;
              const isLast = index === virtualMessages.length - 1;

              if (item.type === "separator" && authUser) {
                return (
                  <Flex
                    justify="center"
                    align="center"
                    mx={4}
                    mt={isFirst ? 3 : 2}
                    mb={2}
                    gap={2}
                  >
                    <Divider />
                    <Box
                      bgColor="mutedSurface"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      <Text fontSize="xs" whiteSpace="nowrap">
                        {item.value}
                      </Text>
                    </Box>
                    <Divider />
                  </Flex>
                );
              }

              if (item.type === "loader") {
                return (
                  <Flex pl={5} pt={2} pb={5} gap={2} alignItems="flex-end">
                    <Image boxSize="24px" src="/favicon.ico" alt="Bot Icon" />
                    <Flex gap={1}>
                      {[...Array(3)].map((_, i) => (
                        <SkeletonCircle key={i} size="2" />
                      ))}
                    </Flex>
                  </Flex>
                );
              }

              const msg = item.value as Message;
              const isLastBotMessage =
                msg === lastMessage && msg.sender === "bot";
              return (
                <Box mx={5}>
                  <MessageItem
                    message={msg}
                    user={user}
                    speakText={speakText}
                    playingMessage={playingMessage}
                    setPlayingMessage={setPlayingMessage}
                    onRetry={
                      isLastBotMessage && onRetryMessage
                        ? () => onRetryMessage(msg)
                        : undefined
                    }
                    mt={isFirst && !authUser ? 3 : 0}
                    pt={isFirst ? 3 : 2}
                    pb={isLast ? 3 : 2}
                  />
                </Box>
              );
            }}
          />
        </Box>
      )}
      {readyToRender && messages.length > 0 && showScrollButton && (
        <IconButton
          aria-label="Scroll to bottom"
          icon={<IoMdArrowDown />}
          colorScheme={accentColor}
          isRound
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          onClick={scrollToBottom}
          size="sm"
        />
      )}
      <Box as="div" ref={messagesEndRef} />
    </Box>
  );
};

export default memo(MessagesLayout);
