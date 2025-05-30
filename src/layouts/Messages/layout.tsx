"use client";

import React, {
  FC,
  Fragment,
  useMemo,
  useRef,
  memo,
  RefObject,
  useEffect,
  useState,
} from "react";
import {
  Box,
  VStack,
  Text,
  Flex,
  Image,
  SkeletonCircle,
  Spinner,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { User } from "@/lib/firebase";
import { MessageItem } from "@/components";
import { formatDateGrouping } from "@/utils/dateFormatter";

interface Message {
  id?: string;
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

const MessagesLayoutComponent: FC<MessagesLayoutProps> = ({
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
  const bgColor = useColorModeValue("gray.200", "gray.700");
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [readyToRender, setReadyToRender] = useState(false);

  const virtualMessages = useMemo(() => {
    const result: Array<{
      type: "separator" | "message" | "loader";
      value?: any;
    }> = [];

    let lastDate: string | null = null;

    messages.forEach((msg) => {
      const date = msg.createdAt ?? new Date(msg.timestamp).toISOString();
      const formatted = formatDateGrouping(date);
      if (formatted !== lastDate) {
        result.push({ type: "separator", value: formatted });
        lastDate = formatted;
      }
      result.push({ type: "message", value: msg });
    });

    if (isFetchingResponse) {
      result.push({ type: "loader" });
    }

    return result;
  }, [messages, isFetchingResponse]);

  useEffect(() => {
    if (!readyToRender && virtualMessages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          virtuosoRef.current?.scrollToIndex({
            index: virtualMessages.length - 1,
            behavior: "auto",
            offset: 1000000,
          });

          setTimeout(() => {
            setReadyToRender(true);
          }, 200);
        });
      });
    }
  }, [virtualMessages.length, readyToRender]);

  if (isLoading && messages.length === 0) {
    return (
      <Flex
        flex="1"
        overflowY="auto"
        p={4}
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Fragment>
      <Box flex="1" overflow="hidden">
        {messages.length === 0 ? (
          <VStack height="100%">
            <Flex justify="center" align="center" flex="1">
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
              itemContent={(index, item) => {
                const isFirst = index === 0;
                const isLast = index === virtualMessages.length - 1;

                if (item.type === "separator") {
                  return (
                    <Flex
                      justify="center"
                      align="center"
                      my={3}
                      mx={4}
                      mt={isFirst ? 3 : 0}
                      gap={2}
                    >
                      <Divider />
                      <Box bg={bgColor} px={2} py={1} borderRadius="full">
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
                return (
                  <Box mx={5}>
                    <MessageItem
                      message={msg}
                      user={user}
                      speakText={speakText}
                      playingMessage={playingMessage}
                      setPlayingMessage={setPlayingMessage}
                      pt={isFirst ? 3 : 2}
                      pb={isLast ? 3 : 2}
                    />
                  </Box>
                );
              }}
            />
          </Box>
        )}
        <Box as="div" ref={messagesEndRef} />
      </Box>
    </Fragment>
  );
};

export default memo(MessagesLayoutComponent);
