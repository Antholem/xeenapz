import { FC, Fragment, useRef, useState } from "react";
import {
  Flex,
  IconButton,
  Card,
  Tooltip,
  Divider,
  Image,
  Box,
} from "@chakra-ui/react";
import { IoStop, IoImageOutline, IoClose } from "react-icons/io5";
import { IoIosMic, IoMdSend } from "react-icons/io";
import { SpeechRecognize } from "@/lib";
import { Input } from "@themed-components";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  sendMessage: (image?: string | null) => void;
}

const MessageInput: FC<MessageInputProps> = ({
  input,
  setInput,
  isListening,
  resetTranscript,
  isFetchingResponse,
  isDisabled,
  sendMessage,
}) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
        {imagePreview && (
          <Box position="relative" mb={2} maxW="200px">
            <Image src={imagePreview} alt="preview" borderRadius="md" />
            <IconButton
              aria-label="Remove image"
              icon={<IoClose />}
              size="xs"
              variant="ghost"
              position="absolute"
              top={0}
              right={0}
              onClick={removeImage}
            />
          </Box>
        )}
        <Flex gap={2} justify="center" align="center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(imagePreview);
                removeImage();
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
            style={{ display: "none" }}
            ref={fileRef}
            onChange={handleImageChange}
          />
          <Tooltip label="Upload image">
            <IconButton
              aria-label="Upload image"
              variant="ghost"
              icon={<IoImageOutline />}
              onClick={() => fileRef.current?.click()}
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
              onClick={() => {
                sendMessage(imagePreview);
                removeImage();
              }}
            />
          </Tooltip>
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
