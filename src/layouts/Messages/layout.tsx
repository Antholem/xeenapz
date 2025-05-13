import React, {
  Fragment,
  RefObject,
  UIEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
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
  id?: string;
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
  isLoading: parentIsLoading = false,
  emptyStateText = "",
  loadPreference = "balanced",
}) => {
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialRenderOrNewMessagesRef = useRef(true);
  const userInteractedWithScrollRef = useRef(false);
  const prevMessagesRef = useRef<Message[]>(messages);

  const getLoadCounts = useCallback((preference: LoadPreference) => {
    if (typeof preference === "number") {
      return {
        initial: Math.max(20, preference),
        more: Math.max(10, Math.ceil(preference / 2)),
      };
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
  }, []);

  const { initial: initialDisplayCount, more: loadMoreCount } =
    getLoadCounts(loadPreference);

  useEffect(() => {
    if (parentIsLoading) {
      setLoadedMessages([]);
      setHasMore(false);
      isInitialRenderOrNewMessagesRef.current = true;
      return;
    }

    if (
      messages !== prevMessagesRef.current ||
      (loadedMessages.length === 0 && messages.length > 0)
    ) {
      const totalMessagesCount = messages.length;
      if (totalMessagesCount > 0) {
        const initialToShow = messages.slice(-initialDisplayCount);
        setLoadedMessages(initialToShow);
        setHasMore(totalMessagesCount > initialDisplayCount);
        isInitialRenderOrNewMessagesRef.current = true;
        userInteractedWithScrollRef.current = false;
      } else {
        setLoadedMessages([]);
        setHasMore(false);
      }
      prevMessagesRef.current = messages;
    } else if (
      messages.length > prevMessagesRef.current.length &&
      !userInteractedWithScrollRef.current
    ) {
      const newMessagesCount = messages.length - prevMessagesRef.current.length;
      const newMessages = messages.slice(-newMessagesCount);
      setLoadedMessages((prevLoaded) => {
        const combined = [...prevLoaded, ...newMessages];
        return combined.slice(-(initialDisplayCount + loadMoreCount));
      });
      isInitialRenderOrNewMessagesRef.current = true;
      prevMessagesRef.current = messages;
    }
  }, [
    messages,
    parentIsLoading,
    initialDisplayCount,
    loadMoreCount,
    loadedMessages.length,
  ]);

  useEffect(() => {
    if (
      isInitialRenderOrNewMessagesRef.current &&
      messagesEndRef.current &&
      loadedMessages.length > 0
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      isInitialRenderOrNewMessagesRef.current = false;
    }
  }, [loadedMessages, messagesEndRef]);

  const loadMoreMessages = useCallback(() => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    setTimeout(() => {
      const currentTotalLoadedCount = loadedMessages.length;
      const olderMessagesInPropCount =
        messages.length - currentTotalLoadedCount;

      const numberToLoad = Math.min(loadMoreCount, olderMessagesInPropCount);

      if (numberToLoad > 0) {
        const nextChunkToPrepend = messages.slice(
          olderMessagesInPropCount - numberToLoad,
          olderMessagesInPropCount
        );

        const scrollContainer = scrollContainerRef.current;
        const previousScrollHeight = scrollContainer?.scrollHeight || 0;
        const previousScrollTop = scrollContainer?.scrollTop || 0;

        setLoadedMessages((prev) => [...nextChunkToPrepend, ...prev]);
        setHasMore(olderMessagesInPropCount - numberToLoad > 0);

        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop =
              previousScrollTop +
              (scrollContainer.scrollHeight - previousScrollHeight);
          }
        });
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, hasMore, loadedMessages, messages, loadMoreCount]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const atTopThreshold = 10;

    if (target.scrollTop <= atTopThreshold && hasMore && !loadingMore) {
      userInteractedWithScrollRef.current = true;
      loadMoreMessages();
    }

    const atBottomThresholdStick = 50;
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight >
      atBottomThresholdStick
    ) {
      userInteractedWithScrollRef.current = true;
    } else {
      userInteractedWithScrollRef.current = false;
    }
  };

  return parentIsLoading && loadedMessages.length === 0 ? (
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
    <Fragment>
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
            const msgDateForGrouping =
              currentMessage.createdAt ||
              (currentMessage.timestamp
                ? new Date(currentMessage.timestamp).toISOString()
                : undefined);
            const currentDate = formatDateGrouping(msgDateForGrouping);

            const prevMsg = array[index - 1];
            const prevMsgDateForGrouping =
              prevMsg?.createdAt ||
              (prevMsg?.timestamp
                ? new Date(prevMsg.timestamp).toISOString()
                : undefined);
            const previousDate = prevMsg
              ? formatDateGrouping(prevMsgDateForGrouping)
              : null;

            const shouldShowDateSeparator =
              index === 0 || (currentDate && currentDate !== previousDate);

            const messageKey =
              (currentMessage as any).id ||
              `${currentMessage.timestamp}-${currentMessage.sender}-${index}`;

            return (
              <Fragment key={messageKey}>
                {shouldShowDateSeparator && currentDate && (
                  <Flex
                    key={`date-separator-${currentDate}-${messageKey}`}
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
        {loadedMessages.length === 0 && !parentIsLoading && (
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
    </Fragment>
  );
};

export default MessagesLayout;
