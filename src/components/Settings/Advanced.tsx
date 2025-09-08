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
import { Button, AlertDialogContent } from "@themed-components";
import {
  useAccentColor,
  useToastStore,
  useAuth,
  useChatSettings,
  useTTSVoice,
} from "@/stores";
import { supabase } from "@/lib";

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

const Advanced: FC = () => {
  const { setAccentColor } = useAccentColor();
  const { showToast } = useToastStore();
  const { user } = useAuth();
  const { setSmartSuggestions } = useChatSettings();
  const { setVoice } = useTTSVoice();
  const { setColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // reset color mode to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setColorMode(prefersDark ? "dark" : "light");
      localStorage.removeItem("chakra-ui-color-mode");
      localStorage.setItem("color-mode-preference", "system");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "color-mode-preference",
          newValue: "system",
        })
      );

      // reset other local preferences
      setAccentColor("cyan");
      setSmartSuggestions(true);
      setVoice(null);
      localStorage.removeItem("tts-voice");

      // persist defaults to database
      if (user) {
        const { error } = await supabase
          .from("user_preferences")
          .upsert(
            {
              user_id: user.id,
              color_mode: "system",
              accent_color: "cyan",
              smart_suggestions: true,
              tts_voice: null,
            },
            { onConflict: "user_id" }
          );
        if (error) throw error;
      }

      showToast({
        id: "reset-settings",
        title: "Settings reset",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to reset settings:", err);
      showToast({
        id: "reset-settings-error",
        title: "Failed to reset",
        description: "An error occurred while resetting your settings.",
        status: "error",
      });
    } finally {
      setIsResetting(false);
      onClose();
    }
  };

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Advanced
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Reset Settings"
              description="Restore all preferences to their default values."
              control={
                <Button colorScheme="red" onClick={onOpen}>
                  Reset
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
              Reset Settings
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to restore all settings to their default
              values?
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
                  colorScheme="red"
                  onClick={handleReset}
                  isLoading={isResetting}
                >
                  Reset
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default Advanced;

