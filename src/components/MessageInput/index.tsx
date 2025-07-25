import { FC, Fragment, useEffect, useRef, useState } from "react";
import {
  Flex,
  IconButton,
  Card,
  Tooltip,
  Divider,
  Image,
} from "@chakra-ui/react";
import { IoStop } from "react-icons/io5";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { FiImage, FiX } from "react-icons/fi";
import { SpeechRecognize } from "@/lib";
import { Input } from "@themed-components";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  sendMessage: () => void;
}

const MessageInput: FC<MessageInputProps> = ({
  input,
  setInput,
  isListening,
  resetTranscript,
  isFetchingResponse,
  isDisabled,
  imageFile,
  setImageFile,
  imagePreview,
  sendMessage,
}) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
        <Flex gap={2} direction="column">
          {imagePreview && (
            <Flex align="center" gap={2} mb={2}>
              <Image src={imagePreview} maxW="80px" borderRadius="md" />
              <IconButton
                aria-label="Remove image"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={() => setImageFile(null)}
              />
            </Flex>
          )}
          <Flex gap={2} justify="center" align="center">
            <Input
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
            <Tooltip label="Upload image">
              <IconButton
                as="span"
                aria-label="Upload image"
                variant="ghost"
                icon={<FiImage />}
                onClick={() => fileInputRef.current?.click()}
                isDisabled={isDisabled}
              />
            </Tooltip>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
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
                  (!input.trim() && !imageFile) ||
                  isListening
                }
                onClick={sendMessage}
              />
            </Tooltip>
          </Flex>
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
