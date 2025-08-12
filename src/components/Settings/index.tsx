"use client";

import { FC, ReactNode } from "react";
import {
  Box,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Stack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useBreakpointValue,
  useColorMode,
  Flex,
  Switch,
} from "@chakra-ui/react";
import { Button, ModalContent } from "@themed-components";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode();

  const getBg = (
    state: "base" | "hover" | "active" | "focus",
    isSelected: boolean
  ) => {
    const isDark = colorMode === "dark";

    const palette = {
      base: isDark ? "gray.800" : "gray.100",
      hover: isDark ? "gray.700" : "gray.200",
      active: isDark ? "gray.600" : "gray.300",
      focus: isDark ? "gray.700" : "gray.100",
      nonActiveHover: isDark ? "gray.800" : "gray.100",
      nonActiveActive: isDark ? "gray.700" : "gray.200",
    } as const;

    if (!isSelected) {
      if (state === "base") return "transparent";
      if (state === "hover") return palette.nonActiveHover;
      if (state === "active") return palette.nonActiveActive;
      if (state === "focus") return palette.focus;
    }

    return palette[state];
  };

  const sections: { title: string; items: ReactNode[] }[] = [
    {
      title: "General",
      items: [
        <Text key="general-item-1">Item 1</Text>,
        <Text key="general-item-2">Item 2</Text>,
      ],
    },
    {
      title: "Appearance",
      items: [
        <Flex key="appearance-theme" align="center" justify="space-between" w="full">
          <Text>Dark mode</Text>
          <Switch isChecked={colorMode === "dark"} onChange={toggleColorMode} />
        </Flex>,
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isMobile ? (
            <Stack spacing={4}>
              {sections.map((section) => (
                <Box key={section.title}>
                  <Text fontWeight="bold" mb={2}>
                    {section.title}
                  </Text>
                  <Stack spacing={1}>{section.items.map((item) => item)}</Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Tabs orientation="vertical" variant="unstyled">
              <TabList minW="150px">
                {sections.map((section) => (
                  <Tab
                    key={section.title}
                    justifyContent="flex-start"
                    borderRadius="md"
                    bgColor={getBg("base", false)}
                    _hover={{ bgColor: getBg("hover", false) }}
                    _active={{ bgColor: getBg("active", false) }}
                    _focus={{ bgColor: getBg("focus", false) }}
                    _selected={{
                      bgColor: getBg("base", true),
                      _hover: { bgColor: getBg("hover", true) },
                      _active: { bgColor: getBg("active", true) },
                      _focus: { bgColor: getBg("focus", true) },
                    }}
                  >
                    {section.title}
                  </Tab>
                ))}
              </TabList>
              <TabPanels>
                {sections.map((section) => (
                  <TabPanel key={section.title} p={0}>
                    <Stack spacing={1} align="start" p={4}>
                      {section.items.map((item) => item)}
                    </Stack>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;

