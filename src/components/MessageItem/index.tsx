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
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import { ImageModal } from "@themed-components";
import { useAccentColor, useToastStore } from "@/stores";

interface Message {
  id: string;
  text: string | null;
  sender: "user" | "bot";
  timestamp: number;
  image?: {
    id: string;
    path: string;
    url: string;
  } | null;
  suggestions?: string[];
}

interface MessageItemProps extends BoxProps {
  message: Message;
  user: { id: string } | null; // Supabase-style user object
  speakText: (
    text: string,
    id: string,
    playingMessageId: string | null,
    setPlayingMessageId: (msg: string | null) => void
  ) => void;
  setPlayingMessageId: (msg: string | null) => void;
  playingMessageId: string | null;
  onRetry?: () => void;
  isHighlighted?: boolean;
  onSelectSuggestion?: (text: string) => void;
}

const MessageItem: FC<MessageItemProps> = ({
  message,
  user,
  speakText,
  playingMessageId,
  setPlayingMessageId,
  onRetry,
  isHighlighted = false,
  onSelectSuggestion,
  ...props
}) => {
  const isUser = message.sender === "user";
  const formattedTime =
    user &&
    format(new Date(message.timestamp), "hh:mm a", {
      locale: enUS,
    });

  const { accentColor } = useAccentColor();
  const { colorMode } = useColorMode();
  const { showToast } = useToastStore();
  const [copied, setCopied] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const botHighlightBg = useColorModeValue(`gray.400`, `gray.500`);
  const botHighlightColor = useColorModeValue("gray.900", "gray.100");
  const userHighlightBg = useColorModeValue(
    `${accentColor}.300`,
    `${accentColor}.200`
  );
  const userNormalBg = useColorModeValue(
    `${accentColor}.500`,
    `${accentColor}.400`
  );
  const highlightBg = isUser ? userHighlightBg : botHighlightBg;
  const normalBg = isUser ? userNormalBg : "mutedSurface";
  const bubbleBg = isHighlighted ? highlightBg : normalBg;
  const bubbleColor = isHighlighted
    ? isUser
      ? "white"
      : botHighlightColor
    : isUser
    ? "white"
    : "";

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
            <>
              <Image
                src={message.image.url}
                id={message.image.id}
                alt={message.image.id}
                mt={2}
                maxW={200}
                rounded="md"
                cursor="pointer"
                onClick={() => setIsImageOpen(true)}
              />
              <ImageModal
                isOpen={isImageOpen}
                onClose={() => setIsImageOpen(false)}
                src={message.image.url}
                alt={message.image.id}
              />
            </>
          )}
          {message.text && (
            <Box
              p={3}
              borderRadius="lg"
              color={bubbleColor}
              bg={bubbleBg}
              transition="background-color 0.4s"
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

          {message.sender === "bot" && message.suggestions?.length ? (
            <Flex mt={2} wrap="wrap" gap={2}>
              {message.suggestions.map((sug) => (
                <Button
                  key={sug}
                  size="xs"
                  variant="outline"
                  onClick={() => onSelectSuggestion?.(sug)}
                >
                  {sug}
                </Button>
              ))}
            </Flex>
          ) : null}

          <Flex align="center" justify="center" gap={1}>
            {user && (
              <Text fontSize="xs" order={isUser ? 2 : 1}>
                {formattedTime}
              </Text>
            )}
            <Flex
              align="center"
              justify="center"
              gap={0}
              order={isUser ? 1 : 2}
            >
              {!isUser && message.text && (
                <Tooltip
                  label={
                    playingMessageId === message.id ? "Stop" : "Read aloud"
                  }
                >
                  <IconButton
                    aria-label="Read aloud"
                    icon={
                      playingMessageId === message.id ? (
                        <IoStop />
                      ) : (
                        <HiSpeakerWave />
                      )
                    }
                    variant="ghost"
                    size="xs"
                    color={
                      playingMessageId === message.id
                        ? colorMode === "light"
                          ? "red.600"
                          : "red.200"
                        : "inherit"
                    }
                    onClick={() =>
                      speakText(
                        message.text!,
                        message.id,
                        playingMessageId,
                        setPlayingMessageId
                      )
                    }
                  />
                </Tooltip>
              )}
              {message.text &&
                (copied ? (
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
                ))}
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
