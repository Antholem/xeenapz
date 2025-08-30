"use client";

import { FC, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Grid,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Menu, MenuButton, MenuItem, MenuList } from "@/components/ui";
import { useTTSVoice, useAuth } from "@/stores";
import { supabase } from "@/lib";

const getVoiceLabel = (v: SpeechSynthesisVoice) => {
  let label = v.name;
  const dashIndex = label.indexOf(" - ");
  if (dashIndex !== -1) label = label.slice(0, dashIndex);
  label = label.replace(/^Microsoft\s+/i, "").replace(/^Google\s+/i, "");
  return label.trim();
};

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
      templateColumns={{ base: "1fr", md: "1fr auto" }} // stack on mobile
      columnGap={4}
      rowGap={{ base: 3, md: 1 }}
      alignItems={{ base: "start", md: "center" }}
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

      <Flex
        justify={{ base: "stretch", md: "flex-end" }}
        minW={{ base: 0, md: "fit-content" }}
        w={{ base: "full", md: "auto" }}
      >
        {control}
      </Flex>
    </Grid>
  );
};

const VoiceAndAccessibility: FC = () => {
  const { voice, setVoice } = useTTSVoice();
  const { user } = useAuth();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("tts_voice")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load tts voice:", error);
        return;
      }

      if (data?.tts_voice !== undefined && data.tts_voice !== null) {
        setVoice(data.tts_voice);
      } else if (voice !== null) {
        const { error: upsertError } = await supabase
          .from("user_preferences")
          .upsert(
            { user_id: user.id, tts_voice: voice },
            { onConflict: "user_id" }
          );
        if (upsertError)
          console.error("Failed to save tts voice:", upsertError);
      }
    })();
  }, [user]);

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Voice
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={6}>
            <SettingRow
              label="Text-to-Speech"
              description="Choose the voice for text-to-speech playback."
              control={
                <Menu>
                  <MenuButton
                    w="full"
                    maxW={{ base: "100%", md: "sm" }}
                    textAlign="left"
                    rightIcon={<ChevronDownIcon />}
                  >
                    {voice === null
                      ? "Default"
                      : (() => {
                          const selected = voices.find((v) => v.name === voice);
                          return selected ? getVoiceLabel(selected) : voice;
                        })()}
                  </MenuButton>
                  <MenuList maxH="300px" overflowY="auto">
                    <MenuItem
                      onClick={async () => {
                        const newVoice = null;
                        setVoice(newVoice);
                        if (!user) return;
                        const { error } = await supabase
                          .from("user_preferences")
                          .upsert(
                            { user_id: user.id, tts_voice: newVoice },
                            { onConflict: "user_id" }
                          );
                        if (error)
                          console.error("Failed to save tts voice:", error);
                      }}
                      bgColor={
                        voice === null
                          ? colorMode === "dark"
                            ? "gray.700"
                            : "gray.100"
                          : undefined
                      }
                    >
                      Default
                    </MenuItem>
                    {voices.map((v) => (
                      <MenuItem
                        key={v.name}
                        onClick={async () => {
                          const newVoice = v.name;
                          setVoice(newVoice);
                          if (!user) return;
                          const { error } = await supabase
                            .from("user_preferences")
                            .upsert(
                              { user_id: user.id, tts_voice: newVoice },
                              { onConflict: "user_id" }
                            );
                          if (error)
                            console.error("Failed to save tts voice:", error);
                        }}
                        bgColor={
                          voice === v.name
                            ? colorMode === "dark"
                              ? "gray.700"
                              : "gray.100"
                            : undefined
                        }
                      >
                        {getVoiceLabel(v)}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              }
            />
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default VoiceAndAccessibility;
