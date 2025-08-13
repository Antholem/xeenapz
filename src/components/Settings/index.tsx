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
} from "@chakra-ui/react";
import { Button, ModalContent } from "@themed-components";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ isOpen, onClose }) => {
  const handleSave = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody>
          <Tabs orientation="vertical" display="flex" h="60vh">
            <TabList
              as={Card}
              flexDir="column"
              overflowY="auto"
              w="200px"
              maxH="full"
              mr={4}
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
        </ModalBody>
        <ModalFooter>
          <HStack gap={2}>
            <Button variant="ghost" colorScheme="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={handleSave}>
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Settings;
