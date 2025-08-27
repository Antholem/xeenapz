"use client";

import { FC } from "react";
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useChatSettings } from "@/stores";

const SectionTitle = ({ title, desc }: { title: string; desc: string }) => (
  <Flex direction="column" gap={1} mb={2}>
    <Text fontWeight="semibold" fontSize="md">
      {title}
    </Text>
    <Text fontSize="sm" color="secondaryText">
      {desc}
    </Text>
  </Flex>
);

const General: FC = () => {
  const { showFollowUpSuggestions, toggleFollowUpSuggestions } =
    useChatSettings();

  return (
    <Flex direction="column" gap={6}>
      <Box>
        <SectionTitle
          title="Follow-up Suggestions"
          desc="Control whether suggestions appear after responses"
        />
        <FormControl display="flex" alignItems="center" gap={3}>
          <Switch
            id="follow-up-suggestions"
            isChecked={showFollowUpSuggestions}
            onChange={toggleFollowUpSuggestions}
          />
          <FormLabel htmlFor="follow-up-suggestions" mb="0">
            Show Follow-up Suggestions in Chat
          </FormLabel>
        </FormControl>
      </Box>
    </Flex>
  );
};

export default General;
