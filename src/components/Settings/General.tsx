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
  useColorModeValue,
} from "@chakra-ui/react";
import { Switch } from "@themed-components";
import { useChatSettings } from "@/stores";

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
  const { showFollowUpSuggestions, toggleFollowUpSuggestions } =
    useChatSettings();

  const cardBg = useColorModeValue("white", "whiteAlpha.50");

  return (
    <Flex direction="column" gap={4}>
      <Card bg={cardBg} borderWidth="1px" borderColor="border">
        <CardHeader>
          <Text fontWeight="semibold">Chat Preferences</Text>
        </CardHeader>

        <Divider />

        <CardBody>
          <SettingRow
            label="Follow-up Suggestions"
            description="Show smart suggestions after assistant responses."
            control={
              <Switch
                id="follow-up-suggestions"
                isChecked={showFollowUpSuggestions}
                onChange={toggleFollowUpSuggestions}
              />
            }
          />
        </CardBody>
      </Card>
    </Flex>
  );
};

export default General;
