"use client";

import { Box, Flex, IconButton, VStack, Divider, Input, Button, InputGroup, InputLeftElement, Card, useBreakpointValue, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, Text, Tooltip } from "@chakra-ui/react";
import { Fragment } from "react";
import { IoAdd, IoSettingsSharp, IoSearch } from "react-icons/io5";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
};

const ChatList = () => (
  [...Array(20)].map((_, index) => (
    <Button key={index} variant="ghost" w="100%" justifyContent="flex-start">
      <Box as="span" w="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" display="block" textAlign="left">
        Chat items
      </Box>
    </Button>
  ))
);

const SideBar = ({ type, isOpen, placement, onClose }: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  if (type === "persistent" && !isLargeScreen) return null;

  return type === "persistent" ? (
    <Fragment>
      <Card borderRadius={0} variant="unstyled">
        <Flex direction="column" h="100vh" w="350px">
          {/* Sidebar Header */}
          <Flex px={3} pt={2} align="center" justify="space-between" fontSize="xl" fontWeight="semibold">
            <Text>Chats</Text>
            <Box>
              <Tooltip label="New chat">
                <IconButton aria-label="New Chat" variant="ghost" icon={<IoAdd />} />
              </Tooltip>
              <Tooltip label="Settings">
                <IconButton aria-label="Settings" variant="ghost" icon={<IoSettingsSharp />} />
              </Tooltip>
            </Box>
          </Flex>

          {/* Search Bar */}
          <Flex p={3} align="center" justify="center">
            <InputGroup>
              <InputLeftElement>
                <IoSearch />
              </InputLeftElement>
              <Input type="search" placeholder="Search titles, chats..." variant="filled" />
            </InputGroup>
          </Flex>

          <Divider />

          {/* Chat List */}
          <VStack h="100vh" p={3} align="stretch" overflowY="auto" spacing={0}>
            <Flex direction="column" align="center" justify="center" w="100%">
              <ChatList />
            </Flex>
          </VStack>
        </Flex>
      </Card>
      <Divider orientation="vertical" />
    </Fragment>
  ) : (
    <Drawer isOpen={!!isOpen} placement={placement!} onClose={onClose!} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <Card borderRadius={0} variant="unstyled" h="100vh">
          {/* Drawer Header */}
          <DrawerHeader p={3} display="flex" alignItems="center" justifyContent="space-between">
            <Text>Chats</Text>
            <Box>
              <Tooltip label="New chat">
                <IconButton aria-label="New Chat" variant="ghost" icon={<IoAdd />} />
              </Tooltip>
              <Tooltip label="Settings">
                <IconButton aria-label="Settings" variant="ghost" icon={<IoSettingsSharp />} />
              </Tooltip>
            </Box>
          </DrawerHeader>

          {/* Search Bar */}
          <Flex p={3}>
            <InputGroup>
              <InputLeftElement>
                <IoSearch />
              </InputLeftElement>
              <Input type="search" placeholder="Search titles, chats..." variant="filled" />
            </InputGroup>
          </Flex>

          <DrawerBody p={3} borderTopWidth="1px">
            <ChatList />
          </DrawerBody>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBar;
