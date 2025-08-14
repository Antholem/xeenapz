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
  useColorMode,
  Divider,
  Icon,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { IoSettingsOutline } from "react-icons/io5";
import { Button, ModalContent } from "@themed-components";
import { useTheme } from "@/stores";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const { colorScheme } = useTheme();

  const modalSize = useBreakpointValue({ base: "full", md: "xl" });
  const orientation = useBreakpointValue({ base: "horizontal", md: "vertical" });

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

  const handleSave = () => onClose();

  return (
    <Modal
      size={modalSize}
      scrollBehavior="inside"
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <Divider orientation="horizontal" />

        <ModalBody p={0}>
          <Tabs
            display={{ base: "block", md: "flex" }}
            orientation={orientation}
            h="60vh"
            variant="unstyled"
          >
            <TabList
              w={{ base: "full", md: "200px" }}
              p={1}
              bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
              border="none"
              minH={0}
              maxH="100%"
              display="flex"
              flexDir={{ base: "row", md: "column" }}
              flexWrap={{ base: "wrap", md: "nowrap" }}
              gap={{ base: 1, md: 0 }}
              overflowY={{ base: "visible", md: "auto" }}
              overflowX="hidden"
              flexShrink={0}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <Tab
                  key={i}
                  justifyContent="flex-start"
                  rounded="md"
                  px={3}
                  py={2}
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
                  flex={{ base: "0 1 auto", md: "initial" }}
                >
                  <Flex align="center" gap={2}>
                    <Icon
                      display={{ base: "none", md: "inline" }}
                      as={IoSettingsOutline}
                      boxSize={4}
                    />
                    {`Tab ${i + 1}`}
                  </Flex>
                </Tab>
              ))}
            </TabList>

            <TabPanels flex="1" minH={0}>
              {Array.from({ length: 20 }).map((_, i) => (
                <TabPanel key={i}>{`Content for Tab ${i + 1}`}</TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <Divider orientation="horizontal" />
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
