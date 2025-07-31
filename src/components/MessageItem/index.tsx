"use client";

import { FC, memo } from "react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { IoIosMic } from "react-icons/io";
import { IoStop } from "react-icons/io5";
import {
  Box,
  Flex,
  Text,
  Image,
  Tooltip,
  IconButton,
  BoxProps,
} from "@chakra-ui/react";
import { useTheme } from "@/stores";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  image_url?: string;
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
}

const MessageItem: FC<MessageItemProps> = ({
  message,
  user,
  speakText,
  playingMessage,
  setPlayingMessage,
  ...props
}) => {
  const isUser = message.sender === "user";
  const formattedTime =
    user &&
    format(new Date(message.timestamp), "hh:mm a", {
      locale: enUS,
    });

  const { colorScheme } = useTheme();

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
            {message.image_url && (
              <Image
                src={message.image_url}
                alt="Uploaded image"
                borderRadius="md"
                mb={message.text ? 2 : 0}
                maxW="200px"
              />
            )}
            {message.text && (
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
            )}
          </Box>

          <Flex align="center" justify="center" gap={1}>
            {user && <Text fontSize="xs">{formattedTime}</Text>}
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
      </Flex>
    </Flex>
  );
};

export default memo(MessageItem);
