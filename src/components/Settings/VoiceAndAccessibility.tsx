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
  Select,
} from "@chakra-ui/react";
import { useTTSVoice } from "@/stores";

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
      templateColumns="1fr auto"
      columnGap={4}
      rowGap={1}
      alignItems="center"
    >
      <Box minW={0}>
        <Text fontWeight="medium">{label}</Text>
        {description && (
          <Text mt={1} fontSize="xs" color="secondaryText" wordBreak="break-word">
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

const VoiceAndAccessibility: FC = () => {
  const { voice, setVoice } = useTTSVoice();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Text-to-Speech
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={6}>
            <SettingRow
              label="Voice"
              description="Choose the voice for text-to-speech playback."
              control={
                <Select
                  value={voice ?? ""}
                  onChange={(e) => setVoice(e.target.value || null)}
                  maxW="sm"
                >
                  <option value="">Default</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {getVoiceLabel(v)}
                    </option>
                  ))}
                </Select>
              }
            />
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default VoiceAndAccessibility;
