"use client";

import { FC, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
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
  ModalCloseButton,
} from "@chakra-ui/react";
import { IoSettings, IoSettingsOutline } from "react-icons/io5";
import { MdOutlineColorLens, MdColorLens, MdInfoOutline, MdInfo } from "react-icons/md";
import { ModalContent } from "@themed-components";
import { useAccentColor } from "@/stores";
import { HiOutlineSpeakerWave, HiSpeakerWave, HiUser } from "react-icons/hi2";
import { BiMessageDetail, BiSolidMessageDetail } from "react-icons/bi";
import { TbArrowBigUpLines, TbArrowBigUpLinesFilled } from "react-icons/tb";
import { HiLockClosed, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import Appearance from "./Appearance";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const { accentColor } = useAccentColor();
  const [tabIndex, setTabIndex] = useState(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  const handleTabListWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    e.preventDefault();
    tabListRef.current?.scrollBy({ left: e.deltaY });
  };

  const getBg = (state: "base" | "hover" | "active" | "selected") => {
    const isDark = colorMode === "dark";
    const palette = {
      base: "transparent",
      selected: isDark ? "gray.700" : "gray.100",
      hover: isDark ? "gray.600" : "gray.200",
      active: isDark ? "gray.500" : "gray.300",
    } as const;
    return palette[state];
  };

  const tabs = [
    {
      key: "general",
      label: "General",
      icon: IoSettingsOutline,
      selectedIcon: IoSettings,
    },
    {
      key: "appearance",
      label: "Appearance",
      icon: MdOutlineColorLens,
      selectedIcon: MdColorLens,
    },
    {
      key: "voice",
      label: "Voice & Accessibility",
      icon: HiOutlineSpeakerWave,
      selectedIcon: HiSpeakerWave,
    },
    {
      key: "chat",
      label: "Chat",
      icon: BiMessageDetail,
      selectedIcon: BiSolidMessageDetail,
    },
    {
      key: "privacy",
      label: "Data & Privacy",
      icon: HiOutlineLockClosed,
      selectedIcon: HiLockClosed,
    },
    {
      key: "account",
      label: "Account",
      icon: HiOutlineUser,
      selectedIcon: HiUser,
    },
    {
      key: "advanced",
      label: "Advanced",
      icon: TbArrowBigUpLines,
      selectedIcon: TbArrowBigUpLinesFilled,
    },
    {
      key: "about",
      label: "About",
      icon: MdInfoOutline,
      selectedIcon: MdInfo,
    },
  ];

  return (
    <Modal
      size={useBreakpointValue({ base: "full", md: "4xl" })}
      scrollBehavior="inside"
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      isCentered
    >
      <ModalOverlay />
      <ModalContent h={{ base: "100dvh", md: "auto" }}>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <Divider orientation="horizontal" />

        <ModalBody p={0} overflow="hidden" h="full">
          <Tabs
            display="flex"
            flexDir={{ base: "column", md: "row" }}
            orientation={isMobile ? "horizontal" : "vertical"}
            h={{ base: "full", md: "60vh" }}
            variant="unstyled"
            index={tabIndex}
            onChange={setTabIndex}
          >
            <TabList
              ref={tabListRef}
              onWheel={handleTabListWheel}
              w={{ base: "full", md: "210px" }}
              p={1}
              bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
              border="none"
              minH={0}
              h={{ md: "100%" }}
              maxH="100%"
              display="flex"
              flexDir={{ base: "row", md: "column" }}
              flexWrap={{ base: "wrap", md: "nowrap" }}
              gap={{ base: 1, md: 0 }}
              overflowY={{ base: "hidden", md: "auto" }}
              overflowX={{ base: "auto", md: "hidden" }}
              flexShrink={0}
            >
              {tabs.map((t, i) => (
                <Tab
                  key={t.key}
                  justifyContent="flex-start"
                  rounded="md"
                  px={3}
                  py={2}
                  gap={2}
                  bgColor={getBg("base")}
                  _selected={{
                    color:
                      colorMode === "dark"
                        ? `${accentColor}.200`
                        : `${accentColor}.600`,
                    bgColor: getBg("selected"),
                  }}
                  _hover={{ bgColor: getBg("hover") }}
                  _active={{ bgColor: getBg("active") }}
                  flex={{ base: "0 1 auto", md: "initial" }}
                >
                  <Flex align="center" gap={2}>
                    <Icon
                      as={tabIndex === i ? t.selectedIcon ?? t.icon : t.icon}
                      boxSize={4}
                    />
                    {t.label}
                  </Flex>
                </Tab>
              ))}
            </TabList>
            <Divider
              orientation={useBreakpointValue({
                base: "horizontal",
                md: "vertical",
              })}
            />

            <TabPanels flex="1" minH={0} overflowY="auto">
              <TabPanel>General settings go here.</TabPanel>
              <TabPanel>
                <Appearance />
              </TabPanel>
              <TabPanel>Voice & Accessibility settings go here.</TabPanel>
              <TabPanel>Chat preferences go here.</TabPanel>
              <TabPanel>Data & Privacy settings go here.</TabPanel>
              <TabPanel>Account settings go here.</TabPanel>
              <TabPanel>Advanced settings go here.</TabPanel>
              <TabPanel>About info goes here.</TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <Divider orientation="horizontal" />
      </ModalContent>
    </Modal>
  );
};

export default Settings;

