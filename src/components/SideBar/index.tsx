"use client";

import { Fragment } from "react";
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
  Text,
  Tooltip,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import { IoAdd, IoSettingsSharp, IoSearch } from "react-icons/io5";
import { FiLogOut, FiUserCheck } from "react-icons/fi";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useAuth } from "@/app/context/Auth";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
}

const ChatList = () =>
  [...Array(20)].map((_, index) => (
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
  ));

const SkeletonChatList = () =>
  [...Array(100)].map((_, index) => (
    <Skeleton key={index} height="40px" width="100%" borderRadius="md" mb={1} />
  ));

const SideBar = ({ type, isOpen, placement, onClose }: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });
  const { user, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (onClose) onClose();
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  const sidebarContent = (
    <Card
      borderRadius={0}
      variant="unstyled"
      display={!isLargeScreen || !user ? "none" : "block"}
    >
      <Flex direction="column" h="100vh" w="350px">
        {/* Sidebar Header */}
        <Flex
          px={3}
          pt={2}
          align="center"
          justify="space-between"
          fontSize="xl"
          fontWeight="semibold"
        >
          {/* Profile Avatar */}
          <Flex align="center" justify="start" gap={3}>
            {loading ? (
              <Fragment>
                <SkeletonCircle height="32px" width="32px" />
                <Box width="180px">
                  <Skeleton height="16px" mb="2px" />
                  <Skeleton height="14px" />
                </Box>
              </Fragment>
            ) : (
              user && (
                <Fragment>
                  <Menu>
                    <MenuButton
                      as={Box}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      cursor="pointer"
                    >
                      <Avatar
                        size="sm"
                        src={user.photoURL ?? "/default-avatar.png"}
                        name={user.displayName ?? "User"}
                      />
                    </MenuButton>
                    <MenuList>
                      <MenuItem
                        onClick={handleGoogleSignIn}
                        icon={<Icon as={FiUserCheck} />}
                        fontSize="md"
                      >
                        Switch Account
                      </MenuItem>
                      <MenuItem
                        onClick={handleSignOut}
                        icon={<Icon as={FiLogOut} />}
                        fontSize="md"
                      >
                        Log out
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  <Box
                    lineHeight="1.2"
                    maxW="200px"
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    <Text fontWeight="bold" fontSize="sm" isTruncated>
                      {user.displayName}
                    </Text>
                    <Text fontSize="xs" color="gray.400" isTruncated>
                      {user.email}
                    </Text>
                  </Box>
                </Fragment>
              )
            )}
          </Flex>
          <Box>
            <Tooltip label="New chat">
              <IconButton
                aria-label="New Chat"
                variant="ghost"
                icon={<IoAdd />}
              />
            </Tooltip>
            <Tooltip label="Settings">
              <IconButton
                aria-label="Settings"
                variant="ghost"
                icon={<IoSettingsSharp />}
              />
            </Tooltip>
          </Box>
        </Flex>

        {/* Search Bar */}
        <Flex p={3} align="center" justify="center">
          <InputGroup>
            <InputLeftElement>
              <IoSearch />
            </InputLeftElement>
            <Input
              type="search"
              placeholder="Search titles, chats..."
              variant="filled"
            />
          </InputGroup>
        </Flex>

        <Divider />

        {/* Chat List */}
        <VStack
          h="100vh"
          p={3}
          align="stretch"
          overflowY={loading ? "hidden" : "auto"}
          spacing={0}
        >
          <Flex direction="column" align="center" justify="center" w="100%">
            {loading ? <SkeletonChatList /> : <ChatList />}
          </Flex>
        </VStack>
      </Flex>
    </Card>
  );

  return type === "persistent" ? (
    <Fragment>
      {sidebarContent}
      <Divider orientation="vertical" />
    </Fragment>
  ) : (
    <Drawer
      isOpen={!!isOpen}
      placement={placement!}
      onClose={onClose!}
      size="xs"
    >
      <DrawerOverlay />
      <DrawerContent>
        <Card borderRadius={0} variant="unstyled" h="100vh">
          {/* Drawer Header */}
          <DrawerHeader
            px={3}
            py={2}
            pb={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Profile Section */}
            <Flex align="center" justify="start" gap={3}>
              {loading ? (
                <Fragment>
                  <SkeletonCircle height="32px" width="32px" />
                  <Box width="150px">
                    <Skeleton height="16px" mb="2px" />
                    <Skeleton height="14px" />
                  </Box>
                </Fragment>
              ) : (
                user && (
                  <Fragment>
                    <Menu>
                      <MenuButton
                        as={Box}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        cursor="pointer"
                      >
                        <Avatar
                          size="sm"
                          src={user.photoURL ?? "/default-avatar.png"}
                          name={user.displayName ?? "User"}
                        />
                      </MenuButton>
                      <MenuList>
                        <MenuItem
                          onClick={handleGoogleSignIn}
                          icon={<Icon as={FiUserCheck} />}
                          fontSize="md"
                        >
                          Switch Account
                        </MenuItem>
                        <MenuItem
                          onClick={handleSignOut}
                          icon={<Icon as={FiLogOut} />}
                          fontSize="md"
                        >
                          Log out
                        </MenuItem>
                      </MenuList>
                    </Menu>
                    <Box
                      textAlign="left"
                      lineHeight="1.2"
                      maxW="170px"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                    >
                      <Text fontWeight="bold" fontSize="sm" isTruncated>
                        {user.displayName}
                      </Text>
                      <Text fontSize="xs" color="gray.400" isTruncated>
                        {user.email}
                      </Text>
                    </Box>
                  </Fragment>
                )
              )}
            </Flex>

            {/* Action Buttons */}
            <Box>
              <Tooltip label="New chat">
                <IconButton
                  aria-label="New Chat"
                  variant="ghost"
                  icon={<IoAdd />}
                />
              </Tooltip>
              <Tooltip label="Settings">
                <IconButton
                  aria-label="Settings"
                  variant="ghost"
                  icon={<IoSettingsSharp />}
                />
              </Tooltip>
            </Box>
          </DrawerHeader>

          {/* Search Bar */}
          <Flex px={3} pb={3}>
            <InputGroup>
              <InputLeftElement>
                <IoSearch />
              </InputLeftElement>
              <Input
                type="search"
                placeholder="Search titles, chats..."
                variant="filled"
              />
            </InputGroup>
          </Flex>

          <DrawerBody
            p={3}
            borderTopWidth="1px"
            overflowY={loading ? "hidden" : "auto"}
          >
            {loading ? <SkeletonChatList /> : <ChatList />}
          </DrawerBody>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBar;
