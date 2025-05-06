import React, { memo } from "react";
import {
  Box,
  Flex,
  Text,
  Image,
  Avatar,
  useColorMode,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import { User } from "@/lib/firebase";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { IoStop } from "react-icons/io5";
import { IoIosMic } from "react-icons/io";
import { enUS } from "date-fns/locale";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

interface MessageItemProps {
  message: Message;
  user: User | null;
  speakText: (
    text: string,
    playingMessage: string | null,
    setPlayingMessage: (msg: string | null) => void
  ) => void;
  setPlayingMessage: (msg: string | null) => void;
  playingMessage: string | null;
}

const MessageItem = memo(function MessageItem({
  message,
  user,
  speakText,
  playingMessage,
  setPlayingMessage,
}: MessageItemProps) {
  const { colorMode } = useColorMode();
  const isUser = message.sender === "user";
  const formattedTime = format(new Date(message.timestamp), "hh:mm a", {
    locale: enUS,
  });

  return (
    <Flex
      direction="column"
      align={isUser ? "flex-end" : "flex-start"}
      overflowX="hidden"
      my={1}
    >
      <Flex align="start" gap={4} maxW="70%">
        {!isUser && <Image boxSize="24px" src="/favicon.ico" alt="Bot Icon" />}
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
});

export default MessageItem;
