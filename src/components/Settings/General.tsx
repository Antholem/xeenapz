"use client";

import { FC, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Grid,
  Text,
} from "@chakra-ui/react";
import { Switch } from "@themed-components";
import { useChatSettings, useAuth } from "@/stores";
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

const General: FC = () => {
  const { smartSuggestions, setSmartSuggestions, toggleSmartSuggestions } =
    useChatSettings();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("smart_suggestions")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load smart suggestions:", error);
        return;
      }

      if (data?.smart_suggestions !== undefined && data.smart_suggestions !== null) {
        setSmartSuggestions(data.smart_suggestions);
      } else {
        const { error: upsertError } = await supabase
          .from("user_preferences")
          .upsert(
            { user_id: user.id, smart_suggestions: smartSuggestions },
            { onConflict: "user_id" }
          );
        if (upsertError)
          console.error("Failed to save smart suggestions:", upsertError);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleToggle = async () => {
    const newValue = !smartSuggestions;
    toggleSmartSuggestions();
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, smart_suggestions: newValue },
        { onConflict: "user_id" }
      );
    if (error) console.error("Failed to save smart suggestions:", error);
  };

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={5} py={3}>
          <Text fontWeight="semibold" fontSize="xl">
            Chat Preferences
          </Text>
        </CardHeader>
        <Divider />
        <CardBody px={5} py={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Smart Suggestions"
              description="Show follow-up suggestions after assistant responses."
              control={
                <Switch
                  id="smart-suggestions"
                  isChecked={smartSuggestions}
                  onChange={handleToggle}
                />
              }
            />
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default General;
