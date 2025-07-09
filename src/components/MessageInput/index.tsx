"use client";

import { FC, Fragment, useRef } from "react";
import {
  Flex,
  IconButton,
  Card,
  Tooltip,
  Divider,
  Input as ChakraInput,
  Image,
  Box,
} from "@chakra-ui/react";
import { IoStop, IoClose } from "react-icons/io5";
import { IoIosMic, IoMdImage, IoMdSend } from "react-icons/io";
import { SpeechRecognize } from "@/lib";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  sendMessage: () => void;
  imagePreview: string | null;
  onSelectImage: (file: File) => void;
  onRemoveImage: () => void;
}

const MessageInput: FC<MessageInputProps> = ({
  input,
  setInput,
  isListening,
  resetTranscript,
  isFetchingResponse,
  isDisabled,
  sendMessage,
  imagePreview,
  onSelectImage,
  onRemoveImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      {imagePreview && (
        <Box px={3} py={2}>
          <Flex align="center" gap={2}>
            <Image
              src={imagePreview}
              alt="Preview"
              boxSize="80px"
              objectFit="cover"
              borderRadius="md"
            />
            <IconButton
              aria-label="Remove image"
              icon={<IoClose />}
              onClick={onRemoveImage}
              variant="ghost"
              size="sm"
            />
          </Flex>
        </Box>
      )}
      <Card p={3} borderRadius={0} variant="surface">
        <Flex gap={2} justify="center" align="center">
          <ChakraInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Write a message..."
            flex="1"
            variant="filled"
            isDisabled={isDisabled}
          />
          <Tooltip label="Upload Image">
            <IconButton
              aria-label="Upload Image"
              icon={<IoMdImage />}
              variant="ghost"
              isDisabled={isDisabled}
              onClick={() => fileInputRef.current?.click()}
            />
          </Tooltip>
          <Tooltip label={isListening ? "Stop" : "Type by voice"}>
            <IconButton
              aria-label="Speech Recognition"
              variant="ghost"
              icon={isListening ? <IoStop /> : <IoIosMic />}
              onClick={toggleSpeechRecognition}
              isDisabled={isDisabled}
            />
          </Tooltip>
          <Tooltip label="Send message">
            <IconButton
              aria-label="Send Message"
              variant="ghost"
              icon={<IoMdSend />}
              isDisabled={
                isFetchingResponse ||
                (!input.trim() && !imagePreview) ||
                isListening
              }
              onClick={sendMessage}
            />
          </Tooltip>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type.startsWith("image/")) {
                onSelectImage(file);
              }
            }}
          />
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
