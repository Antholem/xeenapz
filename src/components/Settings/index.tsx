"use client";

import { FC } from "react";
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
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
} from "@chakra-ui/react";
import { Button } from "@themed-components";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "General",
    items: ["Item 1", "Item 2"],
  },
  {
    title: "Appearance",
    items: ["Item 1", "Item 2"],
  },
];

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
                  <Stack spacing={1}>
                    {section.items.map((item) => (
                      <Text key={item}>{item}</Text>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Tabs orientation="vertical" variant="enclosed">
              <TabList minW="150px">
                {sections.map((section) => (
                  <Tab key={section.title}>{section.title}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {sections.map((section) => (
                  <TabPanel key={section.title} p={0}>
                    <Stack spacing={1} align="start" p={4}>
                      {section.items.map((item) => (
                        <Text key={item}>{item}</Text>
                      ))}
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

