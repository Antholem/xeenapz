"use client";

import { FC } from "react";
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
  const { smartSuggestions, toggleSmartSuggestions } = useChatSettings();
  const { user } = useAuth();

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
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Chat Preferences
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Smart Suggestions"
              description="Show quick follow-up suggestions after assistant responses."
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
