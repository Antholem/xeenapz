"use client";

import { FC, Fragment, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  ButtonProps,
  IconButton,
  Menu,
  MenuButton,
  Portal,
  Icon,
  useColorMode,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  HStack,
  Tooltip,
  MenuDivider,
} from "@chakra-ui/react";
import {
  Button,
  Input,
  AlertDialogContent,
  MenuItem,
  MenuList,
} from "@themed-components";
import { HiOutlineDotsVertical, HiPencil, HiTrash } from "react-icons/hi";
import { RiArchive2Fill, RiPushpinFill, RiUnpinFill } from "react-icons/ri";
import { useAuth, useAccentColor, useToastStore } from "@/stores";
import { ThreadWrapper } from "@/components";
import { supabase } from "@/lib";

interface Thread {
  id: string;
  title?: string;
  is_pinned?: boolean;
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
  const { user } = useAuth();
  const { colorScheme } = useAccentColor();
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
    if (!user) return;

    try {
      setIsDeleting(true);

      if (pathname === `/thread/${thread.id}`) {
        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await supabase
        .from("messages")
        .delete()
        .eq("user_id", user.id)
        .eq("thread_id", thread.id);

      const { data: files, error: listError } = await supabase.storage
        .from("messages")
        .list(`${user.id}/${thread.id}`);

      if (listError) {
        console.error("Failed to list images:", listError);
      } else if (files && files.length > 0) {
        const paths = files.map(
          (file) => `${user.id}/${thread.id}/${file.name}`
        );
        const { error: removeError } = await supabase.storage
          .from("messages")
          .remove(paths);
        if (removeError) {
          console.error("Failed to remove images:", removeError);
        }
      }

      await supabase
        .from("threads")
        .delete()
        .eq("user_id", user.id)
        .eq("id", thread.id);

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
    if (!user || !newTitle.trim()) return;

    try {
      setIsRenaming(true);

      await supabase
        .from("threads")
        .update({ title: newTitle.trim() })
        .eq("user_id", user.id)
        .eq("id", thread.id);

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
    if (!user) return;

    try {
      await supabase
        .from("threads")
        .update({ is_pinned: true })
        .eq("user_id", user.id)
        .eq("id", thread.id);

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
    if (!user) return;

    try {
      await supabase
        .from("threads")
        .update({ is_pinned: false })
        .eq("user_id", user.id)
        .eq("id", thread.id);

      showToast({
        id: `unpin-${thread.id}`,
        title: "Thread unpinned",
        status: "success",
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

  const handleArchive = async () => {
    if (!user) return;

    try {
      await supabase
        .from("threads")
        .update({ is_archived: true })
        .eq("user_id", user.id)
        .eq("id", thread.id);

      if (pathname === `/thread/${thread.id}`) {
        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      showToast({
        id: `archive-${thread.id}`,
        title: "Thread archived",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to archive thread:", err);
      showToast({
        id: `archive-error-${thread.id}`,
        title: "Failed to archive thread",
        description: "An error occurred while archiving.",
        status: "error",
      });
    }
  };

  return (
    <ThreadWrapper
      isActive={isActive}
      isSearchActive={isSearchActive}
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
                thread.is_pinned ? (
                  isHover ? (
                    <HiOutlineDotsVertical />
                  ) : (
                    <RiPushpinFill />
                  )
                ) : (
                  <HiOutlineDotsVertical />
                )
              }
              opacity={thread.is_pinned ? 1 : 0}
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.2s ease-in-out"
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
          <Portal>
            <MenuList>
              {!thread.is_pinned ? (
                <MenuItem
                  icon={<Icon as={RiPushpinFill} boxSize={4} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePin();
                  }}
                >
                  Pin
                </MenuItem>
              ) : (
                <MenuItem
                  icon={<Icon as={RiUnpinFill} boxSize={4} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnpin();
                  }}
                >
                  Unpin
                </MenuItem>
              )}
              <MenuItem
                icon={<Icon as={RiArchive2Fill} boxSize={4} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive();
                }}
              >
                Archive
              </MenuItem>

              <MenuDivider />

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
          <AlertDialogContent>
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
          <AlertDialogContent>
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
    </ThreadWrapper>
  );
};

export default ThreadItem;
