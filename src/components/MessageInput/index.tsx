import {
  Fragment,
  useState,
  useEffect,
  RefObject,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Flex,
  IconButton,
  Card,
  Tooltip,
  Divider,
  Box,
  Image,
} from "@chakra-ui/react";
import { IoStop } from "react-icons/io5";
import { IoIosMic, IoMdImage, IoMdSend, IoMdClose } from "react-icons/io";
import { SpeechRecognize } from "@/lib";
import { Input } from "@themed-components";

export interface MessageInputHandle {
  handleFile: (file: File) => void;
}

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  isDisabled?: boolean;
  sendMessage: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  discardImage: () => void;
}

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  (
    {
      input,
      setInput,
      isListening,
      resetTranscript,
      isFetchingResponse,
      isDisabled,
      sendMessage,
      fileInputRef,
      discardImage,
    },
    ref
  ) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleDiscard = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    discardImage();
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useImperativeHandle(ref, () => ({ handleFile }));

  const handleSend = async () => {
    const sendPromise = sendMessage();
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    await sendPromise;
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
        {preview && (
          <Box position="relative" maxW="100px" mb={3}>
            <Image src={preview} alt="Preview" borderRadius="md" />
            <IconButton
              aria-label="Discard image"
              size="xs"
              bg="Background"
              color="primaryText"
              _hover={{ bg: "Background", color: "primaryText" }}
              _active={{ bg: "Background", color: "primaryText" }}
              _focus={{ bg: "Background", color: "primaryText" }}
              icon={<IoMdClose />}
              variant="solid"
              position="absolute"
              top={1}
              right={1}
              isRound={true}
              onClick={handleDiscard}
            />
          </Box>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        <Flex gap={2} justify="center" align="center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                await handleSend();
              }
            }}
            placeholder="Write a message..."
            flex="1"
            variant="filled"
            isDisabled={isDisabled}
          />
          <Tooltip label="Upload image">
            <IconButton
              aria-label="Upload image"
              variant="ghost"
              icon={<IoMdImage />}
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
                isFetchingResponse || (!input.trim() && !preview) || isListening
              }
              onClick={handleSend}
            />
          </Tooltip>
        </Flex>
      </Card>
    </Fragment>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;
