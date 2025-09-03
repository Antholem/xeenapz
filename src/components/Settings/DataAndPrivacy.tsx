"use client";

import { FC, useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Grid,
  Text,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  HStack,
} from "@chakra-ui/react";
import { Button, AlertDialogContent } from "@themed-components";
import { useAuth, useToastStore } from "@/stores";
import { supabase } from "@/lib";
import { useRouter, usePathname } from "next/navigation";
import { formatBytes } from "@/utils/formatBytes";

const SettingRow = ({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) => {
  return (
    <Grid
      templateColumns="1fr auto"
      columnGap={4}
      rowGap={1}
      alignItems="center"
    >
      <Box minW={0}>
        <Text fontWeight="medium">{label}</Text>
        {description && (
          <Text
            mt={1}
            fontSize="xs"
            color="secondaryText"
            wordBreak="break-word"
          >
            {description}
          </Text>
        )}
      </Box>

      <Flex justify="flex-end" minW="fit-content">
        {control}
      </Flex>
    </Grid>
  );
};

const DataAndPrivacy: FC = () => {
  const { user } = useAuth();
  const { showToast } = useToastStore();
  const router = useRouter();
  const pathname = usePathname();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isArchiveOpen,
    onOpen: onArchiveOpen,
    onClose: onArchiveClose,
  } = useDisclosure();
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const archiveCancelRef = useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [supabaseUsage, setSupabaseUsage] = useState<number | null>(null);
  const [localUsage, setLocalUsage] = useState<number | null>(null);

  useEffect(() => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      total += new Blob([key]).size;
      const value = localStorage.getItem(key);
      if (value) total += new Blob([value]).size;
    }
    setLocalUsage(total);
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) {
        setSupabaseUsage(0);
        return;
      }

      let total = 0;
      const { data: threads, error } = await supabase
        .from("threads")
        .select("id")
        .eq("user_id", user.id);
      if (!error && threads) {
        for (const { id } of threads) {
          const { data: files, error: listError } = await supabase.storage
            .from("messages")
            .list(`${user.id}/${id}`);
          if (listError || !files) continue;
          for (const file of files) {
            const size = (file as any).metadata?.size ?? 0;
            total += size;
          }
        }
      }

      setSupabaseUsage(total);
    };

    fetchUsage();
  }, [user]);

  const handleDeleteAll = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      if (pathname?.startsWith("/thread")) {
        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const { data: threads, error: threadsError } = await supabase
        .from("threads")
        .select("id")
        .eq("user_id", user.id);
      if (threadsError) throw threadsError;

      await supabase.from("messages").delete().eq("user_id", user.id);

      if (threads) {
        for (const { id } of threads) {
          const { data: files, error: listError } = await supabase.storage
            .from("messages")
            .list(`${user.id}/${id}`);

          if (listError) {
            console.error("Failed to list images:", listError);
            continue;
          }

          if (files && files.length > 0) {
            const paths = files.map((file) => `${user.id}/${id}/${file.name}`);
            const { error: removeError } = await supabase.storage
              .from("messages")
              .remove(paths);
            if (removeError) {
              console.error("Failed to remove images:", removeError);
            }
          }
        }
      }

      await supabase.from("threads").delete().eq("user_id", user.id);

      onDeleteClose();
      showToast({
        id: "delete-all-threads",
        title: "All threads deleted",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to delete threads:", err);
      showToast({
        id: "delete-all-threads-error",
        title: "Failed to delete",
        description: "An error occurred while deleting your threads.",
        status: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveAll = async () => {
    if (!user) return;

    try {
      setIsArchiving(true);

      if (pathname?.startsWith("/thread")) {
        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await supabase
        .from("threads")
        .update({ is_archived: true })
        .eq("user_id", user.id);

      onArchiveClose();
      showToast({
        id: "archive-all-threads",
        title: "All threads archived",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to archive threads:", err);
      showToast({
        id: "archive-all-threads-error",
        title: "Failed to archive",
        description: "An error occurred while archiving your threads.",
        status: "error",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Storage Usage
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Supabase Storage"
              description="Files stored in Supabase."
              control={
                <Text>
                  {supabaseUsage !== null
                    ? formatBytes(supabaseUsage)
                    : "-"}
                </Text>
              }
            />
            <Divider />
            <SettingRow
              label="Local Storage"
              description="Data stored in your browser."
              control={
                <Text>
                  {localUsage !== null ? formatBytes(localUsage) : "-"}
                </Text>
              }
            />
          </Flex>
        </CardBody>
      </Card>

      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Data Management
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Archive All Threads"
              description="Move all your threads to the archive."
              control={<Button onClick={onArchiveOpen}>Archive</Button>}
            />
            <Divider />
            <SettingRow
              label="Delete All Threads"
              description="Permanently remove all of your threads."
              control={
                <Button colorScheme="red" onClick={onDeleteOpen}>
                  Delete
                </Button>
              }
            />
          </Flex>
        </CardBody>
      </Card>

      <AlertDialog
        isOpen={isArchiveOpen}
        leastDestructiveRef={archiveCancelRef}
        onClose={onArchiveClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Archive All Threads
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to archive all your threads?
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack gap={4}>
                <Button
                  variant="ghost"
                  colorScheme="gray"
                  onClick={onArchiveClose}
                  ref={archiveCancelRef}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleArchiveAll}
                  isLoading={isArchiving}
                >
                  Archive
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete All Threads
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete all your threads? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack gap={4}>
                <Button
                  variant="ghost"
                  colorScheme="gray"
                  onClick={onDeleteClose}
                  ref={deleteCancelRef}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  colorScheme="red"
                  onClick={handleDeleteAll}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default DataAndPrivacy;
