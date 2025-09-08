"use client";

import { FC, useRef, useState } from "react";
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
  useColorMode,
} from "@chakra-ui/react";
import { Button, AlertDialogContent, Input } from "@themed-components";
import {
  useAuth,
  useToastStore,
  useAccentColor,
  useChatSettings,
  useModel,
  useTTSVoice,
  useTempThread,
  useThreadInput,
  useThreadMessages,
} from "@/stores";
import { supabase } from "@/lib";
import { useRouter } from "next/navigation";
import { HiOutlineTrash } from "react-icons/hi";

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

const Account: FC = () => {
  const { user, setLoading: setAuthLoading } = useAuth();
  const { showToast } = useToastStore();
  const { reset: resetAccentColor } = useAccentColor();
  const { reset: resetChatSettings } = useChatSettings();
  const { reset: resetModel } = useModel();
  const { reset: resetTTSVoice } = useTTSVoice();
  const { reset: resetTempThread } = useTempThread();
  const { clearInputs } = useThreadInput();
  const { clearMessages } = useThreadMessages();
  const { setColorMode } = useColorMode();
  const router = useRouter();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

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
      await supabase.from("user_preferences").delete().eq("user_id", user.id);
      await supabase.from("users").delete().eq("id", user.id);

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      localStorage.clear();
      sessionStorage.clear();

      setColorMode("system");
      localStorage.setItem("color-mode-preference", "system");

      resetAccentColor();
      resetChatSettings();
      resetModel();
      resetTTSVoice();
      resetTempThread();
      clearInputs();
      clearMessages();

      router.push("/");
      // Ensure auth store reflects signed-out state to avoid persistent loading UI
      setAuthLoading(false);

      showToast({
        id: "delete-account-success",
        title: "Account deleted",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to delete account:", err);
      showToast({
        id: "delete-account-error",
        title: "Failed to delete account",
        description: "An error occurred while deleting your account.",
        status: "error",
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Account
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Delete Account"
              description="Permanently delete your account and all data."
              control={
                <Button
                  colorScheme="red"
                  leftIcon={<HiOutlineTrash />}
                  onClick={onOpen}
                >
                  Delete
                </Button>
              }
            />
          </Flex>
        </CardBody>
      </Card>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>
            <AlertDialogBody>
              <Flex direction="column" gap={4}>
                <Text>
                  Please enter your email to confirm account deletion. This action
                  cannot be undone.
                </Text>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Flex>
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
                  leftIcon={<HiOutlineTrash />}
                  onClick={handleDeleteAccount}
                  isLoading={isDeleting}
                  isDisabled={email !== user?.email}
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

export default Account;

