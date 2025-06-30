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
  HStack,
} from "@chakra-ui/react";
import { HiOutlineDotsVertical, HiPencil, HiTrash } from "react-icons/hi";
import { db, collection, getDocs, deleteDoc, doc, updateDoc } from "@/lib";
import { Button, Input } from "@themed-components";
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
  const {
    isOpen: isRenameOpen,
    onOpen: onRenameOpen,
    onClose: onRenameClose,
  } = useDisclosure();

  const cancelRef = useRef<HTMLButtonElement>(null);
  const renameCancelRef = useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title || "");

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const threadRef = doc(db, "threads", thread.id);
      const messagesRef = collection(db, "threads", thread.id, "messages");

      const messagesSnap = await getDocs(messagesRef);
      await Promise.all(
        messagesSnap.docs.map((msgDoc) => deleteDoc(msgDoc.ref))
      );

      if (pathname === `/thread/${thread.id}`) {
        router.push("/");
      }

      await deleteDoc(threadRef);
      onDeleteThread?.(thread.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete thread:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!newTitle.trim()) return;

    try {
      setIsRenaming(true);
      const threadRef = doc(db, "threads", thread.id);
      await updateDoc(threadRef, { title: newTitle.trim() });
      onRenameClose();
    } catch (err) {
      console.error("Failed to rename thread:", err);
    } finally {
      setIsRenaming(false);
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
        isActive && !isSearchActive
          ? colorMode === "dark"
            ? "gray.800"
            : "gray.100"
          : "transparent"
      }
      _hover={{
        bgColor:
          colorMode === "dark"
            ? isActive && !isSearchActive
              ? "gray.700"
              : "gray.800"
            : isActive
            ? "gray.200"
            : "gray.100",
      }}
      _active={{
        bgColor:
          colorMode === "dark"
            ? isActive && !isSearchActive
              ? "gray.600"
              : "gray.700"
            : isActive
            ? "gray.300"
            : "gray.200",
      }}
      _focus={{
        bgColor:
          colorMode === "dark"
            ? "gray.700"
            : isActive && !isSearchActive
            ? "gray.200"
            : "gray.100",
      }}
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
              <MenuItem
                icon={<Icon as={HiPencil} boxSize={4} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTitle(thread.title || "");
                  onRenameOpen();
                }}
              >
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
              <HStack gap={4}>
                <Button
                  variant="ghost"
                  colorScheme="gray"
                  onClick={onClose}
                  ref={cancelRef}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  colorScheme="red"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  loadingText="Deleting"
                >
                  Delete
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={isRenameOpen}
        leastDestructiveRef={renameCancelRef}
        onClose={onRenameClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bgColor="mutedSurface">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Rename Thread
            </AlertDialogHeader>
            <AlertDialogBody>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new thread title"
                autoFocus
              />
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack gap={2}>
                <Button
                  variant="ghost"
                  colorScheme="gray"
                  ref={renameCancelRef}
                  onClick={onRenameClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  isLoading={isRenaming}
                  isDisabled={
                    isRenaming ||
                    !newTitle.trim() ||
                    newTitle.trim() === (thread.title || "")
                  }
                >
                  Rename
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default ThreadItem;
