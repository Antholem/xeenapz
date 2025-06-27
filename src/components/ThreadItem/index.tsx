"use client";

import { FC, Fragment, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  Flex,
  ButtonProps,
  IconButton,
  Menu,
  MenuButton,
  Portal,
  MenuList,
  MenuItem,
  Icon,
  useColorMode,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { HiOutlineDotsVertical, HiPencil, HiTrash } from "react-icons/hi";
import { db, collection, getDocs, deleteDoc, doc } from "@/lib";
import { Button } from "@themed-components";
import { useTheme } from "@/stores";

interface Thread {
  id: string;
  title?: string;
}

interface ThreadItemProps extends Omit<ButtonProps, "onClick"> {
  thread: Thread;
  isActive: boolean;
  onThreadClick: (id: string) => void;
  onDeleteThread?: (id: string) => void;
  isMessageMatch?: boolean;
  highlightedText?: ReactNode;
  isSearchActive: boolean;
}

const ThreadItem: FC<ThreadItemProps> = ({
  thread,
  isActive,
  onThreadClick,
  onDeleteThread,
  isMessageMatch = false,
  highlightedText,
  isSearchActive,
}) => {
  const { colorMode } = useColorMode();
  const { colorScheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const threadRef = doc(db, "threads", thread.id);
      const messagesRef = collection(db, "threads", thread.id, "messages");

      const messagesSnap = await getDocs(messagesRef);
      await Promise.all(
        messagesSnap.docs.map((msgDoc) => deleteDoc(msgDoc.ref))
      );

      await deleteDoc(threadRef);

      if (pathname === `/thread/${thread.id}`) router.push("/");
      onDeleteThread?.(thread.id);

      onClose();
    } catch (err) {
      console.error("Failed to delete thread:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Flex
      role="group"
      direction="row"
      align="center"
      borderRadius="md"
      my={0.7}
      transition="background 0.15s ease"
      bgColor={
        isActive
          ? colorMode === "dark"
            ? "gray.800"
            : "gray.100"
          : "transparent"
      }
      _hover={{
        bgColor:
          colorMode === "dark"
            ? isActive
              ? "gray.700"
              : "gray.800"
            : isActive
            ? "gray.200"
            : "gray.100",
      }}
      _active={{ bgColor: colorMode === "dark" ? "gray.700" : "gray.200" }}
      _focus={{ bgColor: colorMode === "dark" ? "gray.700" : "gray.100" }}
    >
      <Button
        variant="ghost"
        w="100%"
        justifyContent="flex-start"
        onClick={() => onThreadClick(thread.id)}
        textAlign="left"
        py={isMessageMatch ? 6 : 0}
        color={
          !isSearchActive && isActive
            ? colorMode === "dark"
              ? `${colorScheme}.300`
              : `${colorScheme}.500`
            : "inherit"
        }
        colorScheme="gray"
        _hover={{ bgColor: "transparent" }}
        _active={{ bgColor: "transparent" }}
        _focus={{ bgColor: "transparent" }}
      >
        <Box
          as="span"
          w="100%"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          display="block"
        >
          {isMessageMatch ? (
            <Fragment>
              {thread.title}
              {highlightedText}
            </Fragment>
          ) : (
            thread.title
          )}
        </Box>
      </Button>

      {!isSearchActive && (
        <Menu>
          <MenuButton
            as={IconButton}
            variant="ghost"
            colorScheme="gray"
            py={isMessageMatch ? 6 : 0}
            aria-label="More Options"
            icon={<HiOutlineDotsVertical />}
            opacity={0}
            _groupHover={{ opacity: 1 }}
            _hover={{ bgColor: "transparent" }}
            _active={{ bgColor: "transparent" }}
            _focus={{ bgColor: "transparent" }}
            onClick={(e) => e.stopPropagation()}
          />
          <Portal>
            <MenuList fontSize="md">
              <MenuItem icon={<Icon as={HiPencil} boxSize={4} />}>
                Rename
              </MenuItem>
              <MenuItem
                icon={<Icon as={HiTrash} boxSize={4} color="red.500" />}
                color="red.500"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      )}

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bgColor="mutedSurface">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Thread
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this thread? This action cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={onClose}
                ref={cancelRef}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default ThreadItem;
