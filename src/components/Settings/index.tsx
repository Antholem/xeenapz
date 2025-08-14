"use client";

import { FC } from "react";
import {
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalFooter,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  useColorMode,
  Divider,
} from "@chakra-ui/react";
import { Button, ModalContent } from "@themed-components";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();

  const handleSave = () => {
    onClose();
  };

  return (
    <Modal
      size="xl"
      scrollBehavior="inside"
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody p={0}>
          <Divider orientation="horizontal" />
          <Tabs orientation="vertical" display="flex" h="60vh">
            <TabList
              as={Card}
              flexDir="column"
              overflowY="auto"
              w="200px"
              maxH="full"
              rounded="none"
              bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
              border="none"
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <Tab key={i} justifyContent="flex-start">
                  {`Tab ${i + 1}`}
                </Tab>
              ))}
            </TabList>
            <TabPanels flex="1">
              {Array.from({ length: 20 }).map((_, i) => (
                <TabPanel key={i}>{`Content for Tab ${i + 1}`}</TabPanel>
              ))}
            </TabPanels>
          </Tabs>
          <Divider orientation="horizontal" />
        </ModalBody>
        <ModalFooter>
          <HStack gap={2}>
            <Button variant="ghost" colorScheme="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="solid" onClick={handleSave}>
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Settings;
