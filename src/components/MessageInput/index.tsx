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
import { IoIosMic, IoMdSend, IoMdImage } from "react-icons/io";
import { SpeechRecognize } from "@/lib";
import { Input } from "@themed-components";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  image: string | null;
  setImage: (value: string | null) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  sendMessage: () => void;
}

const MessageInput: FC<MessageInputProps> = ({
  input,
  setInput,
  image,
  setImage,
  isListening,
  resetTranscript,
  isFetchingResponse,
  isDisabled,
  sendMessage,
}) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const triggerFile = () => fileRef.current?.click();

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
          {image && (
            <Box position="relative">
              <IconButton
                aria-label="Remove image"
                icon={<IoClose />}
                size="sm"
                variant="ghost"
                onClick={() => setImage(null)}
                position="absolute"
                top={1}
                right={1}
              />
              <Image src={image} maxH="100px" alt="preview" />
            </Box>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Tooltip label="Upload image">
            <IconButton
              aria-label="Upload image"
              icon={<IoMdImage />}
              variant="ghost"
              onClick={triggerFile}
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
                isFetchingResponse || (!input.trim() && !image) || isListening
              }
              onClick={sendMessage}
            />
          </Tooltip>
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
