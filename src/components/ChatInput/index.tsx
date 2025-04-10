import { FC } from "react";
import { Flex, Input, IconButton, Card, Tooltip } from "@chakra-ui/react";
import { IoStop } from "react-icons/io5";
import { IoIosMic, IoMdSend } from "react-icons/io";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  resetTranscript: () => void;
  isFetchingResponse: boolean;
  sendMessage: () => void;
}

const ChatInput: FC<ChatInputProps> = ({
  input,
  setInput,
  isListening,
  resetTranscript,
  isFetchingResponse,
  sendMessage,
}) => {
  return (
    <Card p={3} borderRadius={0} variant="unstyled">
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
        />
        <Tooltip label={isListening ? "Stop" : "Type by voice"}>
          <IconButton
            aria-label="Speech Recognition"
            variant="ghost"
            icon={isListening ? <IoStop /> : <IoIosMic />}
            onClick={resetTranscript}
          />
        </Tooltip>
        <Tooltip label="Send message">
          <IconButton
            aria-label="Send Message"
            variant="ghost"
            icon={<IoMdSend />}
            isDisabled={isFetchingResponse || !input.trim()}
            onClick={sendMessage}
          />
        </Tooltip>
      </Flex>
    </Card>
  );
};

export default ChatInput;
