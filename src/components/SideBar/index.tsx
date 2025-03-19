"use client";

import { 
  Box, 
  Flex, 
  IconButton, 
  VStack, 
  Divider, 
  Input, 
  Button, 
  InputGroup, 
  InputLeftElement, 
  Card, 
  useBreakpointValue, 
  Drawer, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  DrawerCloseButton, 
  Text
} from "@chakra-ui/react";
import { IoSettingsSharp, IoCreateOutline } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Fragment } from "react";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
}

const SideBarBody = () => {
  return (
    <Fragment>
      {[...Array(20)].map((_, index) => (
        <Button key={index} variant="ghost" w="100%" justifyContent="flex-start">
          <Box
            as="span"
            w="100%"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            display="block"
            textAlign="left"
          >
            Chat items
          </Box>
        </Button>
      ))}
    </Fragment>
  );
};

const SideBarFooter = () => {
  return (
    <Button leftIcon={<IoSettingsSharp />} variant="ghost" w="100%" justifyContent="flex-start">
      Settings
    </Button>
  );
};

const SideBar = ({ type, isOpen, placement, onClose }: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  if (type === "persistent" && !isLargeScreen) return null;

  return type === "persistent" ? (
    <Fragment>
      <Card borderRadius={0} variant="unstyled">
        <Flex direction="column" h="100vh" w="300px">
          {/* Sidebar Header */}
          <Flex px={3} pt={2} align="center" justify="space-between" fontSize="xl" fontWeight="semibold">
            <Text>Chats</Text>
            <IconButton aria-label="New Chat" variant="ghost" icon={<IoCreateOutline />} />
          </Flex>

          {/* Search Bar */}
          <Flex p={3} align="center" justify="center">
            <InputGroup>
              <InputLeftElement>
                <CiSearch />
              </InputLeftElement>
              <Input type="search" placeholder="Search chats..." />
            </InputGroup>
          </Flex>
          <Divider />

          {/* Sidebar Body */}
          <VStack h="100vh" p={3} align="stretch" justify="start" overflowY="auto" spacing={0}>
            <Flex direction="column" align="center" justify="center" w="100%">
              <SideBarBody />
            </Flex>
          </VStack>
          <Divider />

          {/* Sidebar Footer */}
          <Flex direction="column" p={3} align="center" justify="center">
            <SideBarFooter />
          </Flex>
        </Flex>
      </Card>
      <Divider orientation="vertical" />
    </Fragment>
  ) : (
    <Drawer isOpen={isOpen!} placement={placement!} onClose={onClose!} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <Card borderRadius={0} variant="unstyled" h="100vh">
          {/* Sidebar Header with "Chats" and "New Chat" Button */}
          <DrawerHeader p={3} display="flex" alignItems="center" justifyContent="space-between">
            <Text>Chats</Text>
            <IconButton aria-label="New Chat" variant="ghost" icon={<IoCreateOutline />} />
          </DrawerHeader>

          {/* Search Bar (Moved Below Header) */}
          <Flex p={3}>
            <InputGroup>
              <InputLeftElement>
                <CiSearch />
              </InputLeftElement>
              <Input type="search" placeholder="Search chats..." />
            </InputGroup>
          </Flex>

          {/* Sidebar Body */}
          <DrawerBody p={3}>
            <SideBarBody />
          </DrawerBody>

          {/* Sidebar Footer */}
          <DrawerFooter p={3} borderTopWidth="1px">
            <SideBarFooter />
          </DrawerFooter>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBar;
