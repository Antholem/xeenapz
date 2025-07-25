import { FC, Fragment, useState, ChangeEvent } from "react";
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
  const [image, setImage] = useState<string | null>(null);
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    sendMessage(image);
    setImage(null);
  };

  const removeImage = () => setImage(null);

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
        {image && (
          <Box mb={2} position="relative" width="120px">
            <Image src={image} alt="preview" borderRadius="md" maxH="150px" />
            <IconButton
              size="sm"
              icon={<IoClose />}
              aria-label="Remove image"
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
                handleSend();
              }
            }}
            placeholder="Write a message..."
            flex="1"
            variant="filled"
            isDisabled={isDisabled}
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
          <Tooltip label="Attach image">
            <IconButton as="label" variant="ghost" aria-label="Upload Image" icon={<FiImage />}> 
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Send message">
            <IconButton
              aria-label="Send Message"
              variant="ghost"
              icon={<IoMdSend />}
              isDisabled={
                isFetchingResponse || (!input.trim() && !image) || isListening
              }
              onClick={handleSend}
            />
          </Tooltip>
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
