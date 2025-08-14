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
  Icon,
  Divider,
} from "@chakra-ui/react";
import { Button, ModalContent } from "@themed-components";
import { useTheme } from "@/stores";
import { IoSettingsOutline } from "react-icons/io5";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const { colorScheme } = useTheme();

  const getBg = (state: "base" | "hover" | "active" | "selected") => {
    const isDark = colorMode === "dark";

    const palette = {
      base: "transparent",
      hover: isDark ? "gray.700" : "gray.100",
      active: isDark ? "gray.500" : "gray.300",
      selected: isDark ? "gray.600" : "gray.200",
    } as const;

    return palette[state];
  };

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
          <Tabs orientation="vertical" display="flex" h="60vh" variant="unstyled">
            <TabList
              as={Card}
              flexDir="column"
              overflowY="auto"
              w="200px"
              maxH="full"
              rounded="none"
              bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
              border="none"
              p={1}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <Tab
                  key={i}
                  justifyContent="flex-start"
                  rounded="md"
                  mb={0.5}
                  bgColor={getBg("base")}
                  _selected={{
                    color:
                      colorMode === "dark"
                        ? `${colorScheme}.200`
                        : `${colorScheme}.600`,
                    bgColor: getBg("selected"),
                  }}
                  _hover={{ bgColor: getBg("hover") }}
                  _active={{ bgColor: getBg("active") }}
                >
                  <HStack gap={2}>
                    <Icon as={IoSettingsOutline} />
                    {`Tab ${i + 1}`}
                  </HStack>
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
