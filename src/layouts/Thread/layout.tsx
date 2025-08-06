import { FC, ReactNode, useState, useRef } from "react";
import { Flex, Icon, Text, useColorMode } from "@chakra-ui/react";
import { IoMdImage } from "react-icons/io";
import { useTheme } from "@/stores";

interface ThreadLayoutProps {
  children: ReactNode;
  onFileDrop?: (file: File) => void;
}

const DropOverlay: FC = () => {
  const { colorMode } = useColorMode();
  const { colorScheme } = useTheme();
  const borderColor =
    colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.500`;

  return (
    <Flex
      position="absolute"
      inset={0}
      bg="blackAlpha.600"
      zIndex={10}
      align="center"
      justify="center"
      pointerEvents="none"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Flex
        direction="column"
        align="center"
        gap={4}
        pointerEvents="none"
        px={6}
        py={4}
      >
        <Icon as={IoMdImage} boxSize={16} color="white" />
        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          color="white"
          fontWeight="semibold"
          textAlign="center"
        >
          Drop your image here
        </Text>
      </Flex>
    </Flex>
  );
};

function isImageFileDrag(e: React.DragEvent<HTMLDivElement>): boolean {
  const dt = e.dataTransfer;
  if (!dt) return false;

  if (dt.items && dt.items.length) {
    return Array.from(dt.items).some(
      (item) =>
        item.kind === "file" && !!item.type && item.type.startsWith("image/")
    );
  }

  if (dt.files && dt.files.length) {
    return Array.from(dt.files).some((f) => f.type.startsWith("image/"));
  }

  return false;
}

const ThreadLayout: FC<ThreadLayoutProps> = ({ children, onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const internalDragRef = useRef(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    if (internalDragRef.current) return;
    if (!isImageFileDrag(e)) return;
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    if (internalDragRef.current) return;
    if (!isImageFileDrag(e)) return;
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    if (internalDragRef.current) return;
    if (isImageFileDrag(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    internalDragRef.current = false;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileDrop(file);
    }
  };

  return (
    <Flex
      bgColor="background"
      direction="column"
      flex="1"
      h="100%"
      position="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragStartCapture={() => {
        internalDragRef.current = true;
      }}
      onDragEndCapture={() => {
        internalDragRef.current = false;
      }}
    >
      {isDragging && onFileDrop && <DropOverlay />}
      {children}
    </Flex>
  );
};

export default ThreadLayout;
