import { FC, Fragment } from "react";
import { Flex, IconButton, Card, Tooltip, Divider } from "@chakra-ui/react";
import { IoStop, IoClose, IoImageOutline } from "react-icons/io5";
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
  sendMessage: () => void;
  imagePreview?: string | null;
  onImageChange?: (file: File | null) => void;
  clearImage?: () => void;
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
  onImageChange,
  clearImage,
}) => {
  const toggleSpeechRecognition = () => {
    SpeechRecognize(isListening, resetTranscript);
  };

  return (
    <Fragment>
      <Divider orientation="horizontal" />
      <Card p={3} borderRadius={0} variant="surface">
        {imagePreview && (
          <Flex mb={2} align="center" gap={2}>
            <img
              src={imagePreview}
              style={{ maxHeight: "100px", borderRadius: "8px" }}
              alt="preview"
            />
            {clearImage && (
              <IconButton
                aria-label="Remove image"
                icon={<IoClose />}
                size="sm"
                variant="ghost"
                onClick={clearImage}
              />
            )}
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
          {onImageChange && (
            <>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) =>
                  onImageChange(e.target.files?.[0] ?? null)
                }
              />
              <Tooltip label="Upload image">
                <IconButton
                  as="label"
                  htmlFor="image-input"
                  aria-label="Upload image"
                  icon={<IoImageOutline />}
                  variant="ghost"
                  isDisabled={isDisabled}
                />
              </Tooltip>
            </>
          )}
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
        </Flex>
      </Card>
    </Fragment>
  );
};

export default MessageInput;
