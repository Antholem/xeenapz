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
  Tooltip,
} from "@chakra-ui/react";
import { HiOutlineDotsVertical, HiPencil, HiTrash } from "react-icons/hi";
import { db, collection, getDocs, deleteDoc, doc, updateDoc } from "@/lib";
import { Button, Input } from "@themed-components";
import { useTheme, useToastStore } from "@/stores";
import { RiPushpinFill, RiUnpinFill } from "react-icons/ri";

interface Thread {
  id: string;
  title?: string;
  isPinned?: boolean;
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
  const { showToast } = useToastStore();
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
  const [isHover, setIsHover] = useState(false);

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
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await deleteDoc(threadRef);
      onDeleteThread?.(thread.id);
      onClose();

      showToast({
        id: `delete-${thread.id}`,
        title: "Thread deleted",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to delete thread:", err);
      showToast({
        id: `delete-error-${thread.id}`,
        title: "Failed to delete",
        description: "An error occurred while deleting the thread.",
        status: "error",
      });
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
      showToast({
        id: `rename-${thread.id}`,
        title: "Thread renamed",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to rename thread:", err);
      showToast({
        id: `rename-error-${thread.id}`,
        title: "Rename failed",
        description: "Unable to rename this thread.",
        status: "error",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handlePin = async () => {
    try {
      const threadRef = doc(db, "threads", thread.id);
      await updateDoc(threadRef, { isPinned: true });

      showToast({
        id: `pin-${thread.id}`,
        title: "Thread pinned",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to pin thread:", err);
      showToast({
        id: `pin-error-${thread.id}`,
        title: "Failed to pin thread",
        description: "An error occurred while pinning.",
        status: "error",
      });
    }
  };

  const handleUnpin = async () => {
    try {
      const threadRef = doc(db, "threads", thread.id);
      await updateDoc(threadRef, { isPinned: false });

      showToast({
        id: `unpin-${thread.id}`,
        title: "Thread unpinned",
        status: "info",
      });
    } catch (err) {
      console.error("Failed to unpin thread:", err);
      showToast({
        id: `unpin-error-${thread.id}`,
        title: "Failed to unpin thread",
        description: "An error occurred while unpinning.",
        status: "error",
      });
    }
  };

  return (
    <Flex
      role="group"
      direction="row"
      align="center"
      borderRadius="md"
      my={0.7}
      pr={2}
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
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
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
          <Tooltip label="More Options">
            <MenuButton
              as={IconButton}
              aria-label="More Options"
              variant="ghost"
              colorScheme="gray"
              size="sm"
              py={isMessageMatch ? 6 : 0}
              icon={
                thread.isPinned ? (
                  isHover ? (
                    <HiOutlineDotsVertical />
                  ) : (
                    <RiPushpinFill />
                  )
                ) : (
                  <HiOutlineDotsVertical />
                )
              }
              opacity={thread.isPinned ? 1 : 0}
              _groupHover={{ opacity: 1 }}
              isRound
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
          <Portal>
            <MenuList fontSize="md">
              <MenuItem
                icon={<Icon as={RiPushpinFill} boxSize={4} />}
                onClick={(e) => {
                  e.stopPropagation();
                  thread.isPinned ? handleUnpin() : handlePin();
                }}
              >
                Pin
              </MenuItem>
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
          <AlertDialogContent bgColor="surface">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Rename Thread
            </AlertDialogHeader>
            <AlertDialogBody>
              <Input
                variant="filled"
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
                  variant="ghost"
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
