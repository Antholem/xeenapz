import { FC, ReactNode, useState, useRef } from "react";
import { Flex, Text } from "@chakra-ui/react";

interface ThreadLayoutProps {
  children: ReactNode;
  onFileDrop?: (file: File) => void;
}

const ThreadLayout: FC<ThreadLayoutProps> = ({ children, onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onFileDrop) return;
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
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
    >
      {isDragging && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={10}
          align="center"
          justify="center"
          pointerEvents="none"
        >
          <Text fontSize="2xl" color="white">
            Drop your image here
          </Text>
        </Flex>
      )}
      {children}
    </Flex>
  );
};

export default ThreadLayout;
