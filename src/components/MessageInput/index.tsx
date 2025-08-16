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
    InputLeftElement,
    Menu,
    MenuButton,
  } from "@chakra-ui/react";
import { IoStop, IoAddCircleSharp, IoImageOutline } from "react-icons/io5";
import { IoIosMic, IoMdSend, IoMdClose } from "react-icons/io";
import { SpeechRecognize } from "@/lib";
  import { Input, ImageModal, MenuList, MenuItem, InputGroup } from "@themed-components";

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
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      setIsPreviewOpen(false);
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
        setIsPreviewOpen(false);
      }
      await sendPromise;
    };

    return (
      <Fragment>
        <Divider orientation="horizontal" />
        <Card p={3} borderRadius={0} variant="surface">
            {preview && (
              <>
                <Box position="relative" boxSize="100px" mb={3}>
                  <Image
                    src={preview}
                    alt="Preview"
                    borderRadius="md"
                    cursor="pointer"
                    boxSize="100px"
                    objectFit="cover"
                    onClick={() => setIsPreviewOpen(true)}
                  />
                  <IconButton
                    aria-label="Discard image"
                    size="xs"
                    bg="primaryText"
                    color="background"
                    _hover={{ bg: "primaryText", color: "background" }}
                    _active={{ bg: "primaryText", color: "background" }}
                    _focus={{ bg: "primaryText", color: "background" }}
                    icon={<IoMdClose />}
                    variant="solid"
                    position="absolute"
                    top={1}
                    right={1}
                    isRound={true}
                    onClick={handleDiscard}
                  />
                </Box>
                <ImageModal
                  isOpen={isPreviewOpen}
                  onClose={() => setIsPreviewOpen(false)}
                  src={preview}
                  alt="Preview"
                />
              </>
            )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
            <Flex gap={2} justify="center" align="center">
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="auto">
                  <Menu isLazy lazyBehavior="unmount">
                    <Tooltip label="Add options">
                      <MenuButton
                        as={IconButton}
                        aria-label="Add options"
                        variant="ghost"
                        icon={<IoAddCircleSharp />}
                        isDisabled={isDisabled}
                      />
                    </Tooltip>
                    <MenuList>
                      <MenuItem
                        icon={<IoImageOutline />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload image
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </InputLeftElement>
                <Input
                  leftElement
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      await handleSend();
                    }
                  }}
                  placeholder="Write a message..."
                  variant="filled"
                  isDisabled={isDisabled}
                />
              </InputGroup>
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
