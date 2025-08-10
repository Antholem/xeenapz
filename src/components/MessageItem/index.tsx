"use client";

import { FC, memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { HiSpeakerWave } from "react-icons/hi2";
import { IoStop } from "react-icons/io5";
import { BiSolidCopy } from "react-icons/bi";
import { FaCheck, FaArrowsRotate } from "react-icons/fa6";
import {
  Box,
  Flex,
  Text,
  Image,
  Tooltip,
  IconButton,
  BoxProps,
  useColorMode,
} from "@chakra-ui/react";
import { useTheme, useToastStore } from "@/stores";

interface Message {
  text: string | null;
  sender: "user" | "bot";
  timestamp: number;
  image?: {
    id: string;
    path: string;
    url: string;
  } | null;
}

interface MessageItemProps extends BoxProps {
  message: Message;
  user: { id: string } | null; // Supabase-style user object
  speakText: (
    text: string,
    playingMessage: string | null,
    setPlayingMessage: (msg: string | null) => void
  ) => void;
  setPlayingMessage: (msg: string | null) => void;
  playingMessage: string | null;
  onRetry?: () => void;
}

const MessageItem: FC<MessageItemProps> = ({
  message,
  user,
  speakText,
  playingMessage,
  setPlayingMessage,
  onRetry,
  ...props
}) => {
  const isUser = message.sender === "user";
  const formattedTime =
    user &&
    format(new Date(message.timestamp), "hh:mm a", {
      locale: enUS,
    });

  const { colorScheme } = useTheme();
  const { colorMode } = useColorMode();
  const { showToast } = useToastStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      showToast({
        id: `copy-${Date.now()}`,
        title: "Message copied",
        status: "success",
        duration: 5000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  };

  if (!message.text && !message.image) return null;

  return (
    <Flex
      direction="column"
      align={isUser ? "flex-end" : "flex-start"}
      overflowX="hidden"
      py={1}
      {...props}
    >
      <Flex align="start" gap={4} maxW="70%">
        {!isUser && <Image boxSize="24px" src="/favicon.ico" alt="Bot Icon" />}
        <Box
          display="flex"
          flexDirection="column"
          alignItems={isUser ? "flex-end" : "flex-start"}
          gap={1}
        >
          {message.image && (
            <Image
              src={message.image.url}
              id={message.image.id}
              alt={message.image.id}
              mt={2}
              maxW={200}
              rounded="md"
            />
          )}
          {message.text && (
            <Box
              p={3}
              borderRadius="lg"
              color={isUser ? "white" : ""}
              bg={isUser ? `${colorScheme}.400` : "mutedSurface"}
              maxW="max-content"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              overflowWrap="anywhere"
            >
              <ReactMarkdown
                components={{
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: "20px" }}>{children}</ul>
                  ),
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      style={{
                        wordBreak: "break-all",
                        overflowWrap: "break-word",
                      }}
                    />
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            </Box>
          )}

          <Flex align="center" justify="center" gap={1}>
            {user && <Text fontSize="xs" order={isUser ? 2 : 1}>{formattedTime}</Text>}
            <Flex align="center" justify="center" gap={0} order={isUser ? 1 : 2}>
            {!isUser && message.text && (
              <Tooltip
                label={playingMessage === message.text ? "Stop" : "Read aloud"}
              >
                <IconButton
                  aria-label="Read aloud"
                  icon={
                    playingMessage === message.text ? (
                      <IoStop />
                    ) : (
                      <HiSpeakerWave />
                    )
                  }
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    speakText(message.text!, playingMessage, setPlayingMessage)
                  }
                />
              </Tooltip>
            )}
              {message.text && (
                copied ? (
                  <IconButton
                    aria-label="Message Copied"
                    icon={<FaCheck />}
                    variant="ghost"
                    size="xs"
                    color={colorMode === "light" ? "green.600" : "green.200"}
                  />
                ) : (
                  <Tooltip label="Copy Message">
                    <IconButton
                      aria-label="Copy Message"
                      icon={<BiSolidCopy />}
                      variant="ghost"
                      size="xs"
                      onClick={handleCopy}
                    />
                  </Tooltip>
                )
              )}
              {!isUser && message.text && onRetry && (
                <Tooltip label="Try again">
                  <IconButton
                    aria-label="Try again"
                    icon={<FaArrowsRotate />}
                    variant="ghost"
                    size="xs"
                    onClick={onRetry}
                  />
                </Tooltip>
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default memo(MessageItem);
