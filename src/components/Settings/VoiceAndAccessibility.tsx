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
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { HiSpeakerWave } from "react-icons/hi2";
import { Menu } from "@/components/ui";
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

  const handleTestVoice = () => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      "This is how I will sound."
    );
    if (voice) {
      const selected = window.speechSynthesis
        .getVoices()
        .find((v) => v.name === voice);
      if (selected) utterance.voice = selected;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

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
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Text-to-Speech"
              description="Choose the voice for text-to-speech playback."
              control={
                <Flex gap={2}>
                  <Menu
                    value={voice}
                    onChange={async (newVoice) => {
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
                    items={voices.map((v) => ({
                      value: v.name,
                      label: getVoiceLabel(v),
                    }))}
                    placeholder="Default"
                    buttonProps={{
                      variant: "outline",
                    }}
                  />
                  <Tooltip label="Play sample">
                    <IconButton
                      aria-label="Play sample"
                      icon={<HiSpeakerWave />}
                      variant="outline"
                      onClick={handleTestVoice}
                    />
                  </Tooltip>
                </Flex>
              }
            />
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default VoiceAndAccessibility;
