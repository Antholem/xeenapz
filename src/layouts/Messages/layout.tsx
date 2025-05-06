import React, {
  Fragment,
  RefObject,
  UIEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
  Progress,
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

type LoadPreference = "fast" | "balanced" | "slow" | number;

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
  loadPreference?: LoadPreference;
}

const MessagesLayout: FC<MessagesLayoutProps> = ({
  messages,
  isFetchingResponse,
  user,
  speakText,
  playingMessage,
  setPlayingMessage,
  messagesEndRef,
  isLoading: initialLoading = false,
  emptyStateText = "",
  loadPreference = "balanced",
}) => {
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const shouldScrollBottom = useRef(false);

  const getLoadCounts = (preference: LoadPreference) => {
    if (typeof preference === "number") {
      return { initial: preference, more: Math.ceil(preference / 2) };
    }

    switch (preference) {
      case "fast":
        return { initial: 75, more: 50 };
      case "slow":
        return { initial: 25, more: 15 };
      case "balanced":
      default:
        return { initial: 50, more: 33 };
    }
  };

  const { more: loadMoreCount } = getLoadCounts(loadPreference);

  useEffect(() => {
    if (initialLoading) {
      return;
    }

    setLoadedMessages(messages);
    setHasMore(false);

    shouldScrollBottom.current = true;
  }, [messages, initialLoading]);

  useEffect(() => {
    if (
      messagesEndRef.current &&
      loadedMessages.length > 0 &&
      shouldScrollBottom.current
    ) {
      messagesEndRef.current.scrollIntoView();
      shouldScrollBottom.current = false;
      isInitialLoad.current = false;
    }
  }, [loadedMessages, messagesEndRef]);

  const loadMoreMessages = () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    const currentScrollPosition = scrollContainerRef.current
      ? scrollContainerRef.current.scrollTop
      : 0;
    const currentLoadedCount = loadedMessages.length;
    const remainingMessages = messages.length - currentLoadedCount;
    const messagesToLoad = Math.min(loadMoreCount, remainingMessages);
    const startIndex = Math.max(
      0,
      messages.length - currentLoadedCount - messagesToLoad
    );
    const nextMessages = messages.slice(
      startIndex,
      messages.length - currentLoadedCount
    );

    setTimeout(() => {
      const previousScrollHeight = scrollContainerRef.current
        ? scrollContainerRef.current.scrollHeight
        : 0;
      setLoadedMessages((prev) => [...nextMessages, ...prev]);
      setHasMore(messages.length > loadedMessages.length + messagesToLoad);
      setLoadingMore(false);

      if (scrollContainerRef.current) {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        scrollContainerRef.current.scrollTop =
          currentScrollPosition + (newScrollHeight - previousScrollHeight);
      }
    }, 500);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  return initialLoading ? (
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
    <>
      {loadingMore && <Progress size="xs" isIndeterminate />}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        aria-live="polite"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {loadedMessages.length > 0 &&
          loadedMessages.map((currentMessage, index, array) => {
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
        {loadedMessages.length === 0 && !initialLoading && (
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
    </>
  );
};

export default MessagesLayout;
