import { FC, Fragment, useRef } from "react";
import {
  Flex,
  IconButton,
  Card,
  Tooltip,
  Divider,
  Image,
  Box,
} from "@chakra-ui/react";
import { IoStop, IoClose } from "react-icons/io5";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { FiImage } from "react-icons/fi";
import { SpeechRecognize } from "@/lib";
import { Input } from "@themed-components";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  sendMessage: () => void;
  imagePreview: string | null;
  onSelectImage: (file: File | null) => void;
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
}) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onSelectImage(file || null);
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
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
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Tooltip label="Attach image">
            <IconButton
              aria-label="Upload Image"
              variant="ghost"
              icon={<FiImage />}
              onClick={() => fileInputRef.current?.click()}
              isDisabled={isDisabled}
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
                isFetchingResponse || (!input.trim() && !imagePreview) || isListening
              }
              onClick={sendMessage}
            />
          </Tooltip>
        </Flex>
        {imagePreview && (
          <Box mt={2} position="relative" maxW="200px">
            <Image src={imagePreview} alt="preview" borderRadius="md" />
            <IconButton
              aria-label="Remove image"
              icon={<IoClose />}
              size="sm"
              variant="ghost"
              position="absolute"
              top="0"
              right="0"
              onClick={() => onSelectImage(null)}
            />
          </Box>
        )}
      </Card>
    </Fragment>
  );
};

export default MessageInput;
