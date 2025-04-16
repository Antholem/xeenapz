"use client";

import { FC, Fragment, useEffect, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Divider,
  Input,
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
  Spinner,
} from "@chakra-ui/react";
import { IoAdd, IoSettingsSharp, IoSearch } from "react-icons/io5";
import { FiLogOut, FiUserCheck } from "react-icons/fi";
import {
  auth,
  provider,
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  signInWithPopup,
  signOut,
  User,
} from "@/lib/firebase";
import { useAuth } from "@/app/context/Auth";
import { useRouter } from "next/navigation";
import ConversationList from "../ConversationList";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
}

interface Conversation {
  id: string;
  userId: string;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
  title?: string;
  [key: string]: any;
}

interface MenuItemsProps {
  user: User | null;
  switchAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const NewChatButton = () => {
  const router = useRouter();

  const handleNewChatClick = () => {
    router.push("/");
  };

  return (
    <Tooltip label="New chat">
      <IconButton
        aria-label="New Chat"
        variant="ghost"
        icon={<IoAdd />}
        onClick={handleNewChatClick}
        cursor="pointer"
      />
    </Tooltip>
  );
};

const SettingsButton = () => {
  return (
    <Tooltip label="Settings">
      <IconButton
        aria-label="Settings"
        variant="ghost"
        icon={<IoSettingsSharp />}
      />
    </Tooltip>
  );
};

const SearchBar = () => {
  return (
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
  );
};

const MenuItems: FC<MenuItemsProps> = ({ user, switchAccount, signOut }) => {
  return (
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
          src={user?.photoURL ?? "/default-avatar.png"}
          name={user?.displayName ?? "User"}
        />
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={switchAccount}
          icon={<Icon as={FiUserCheck} />}
          fontSize="md"
        >
          Switch Account
        </MenuItem>
        <MenuItem onClick={signOut} icon={<Icon as={FiLogOut} />} fontSize="md">
          Log out
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

const SkeletonChatList = () => (
  <Flex
    flex="1"
    overflowY="auto"
    p={4}
    aria-live="polite"
    justifyContent="center"
    alignItems="center"
  >
    <Spinner size="xl" />
  </Flex>
);

const SideBar = ({ type, isOpen, placement, onClose }: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });
  const { user, setLoading: setAuthLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const conversationsCollectionRef = collection(db, "conversations");
      const conversationsQuery = query(
        conversationsCollectionRef,
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const conversationsList: Conversation[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Conversation)
          );
          setConversations(conversationsList);
          setLoading(false);
        },
        (error) => {
          console.error("Error listening for conversations:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setConversations([]);
      setLoading(false);
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
      setAuthLoading(true);
    } catch (error: unknown) {
      let errorMessage = "Google Sign-In Error occurred.";
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      console.error(errorMessage);
    } finally {
      setTimeout(() => {
        setAuthLoading(false);
      }, 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setAuthLoading(true);
      if (onClose) onClose();
    } catch (error: unknown) {
      let errorMessage = "Sign-Out Error occurred.";
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      console.error(errorMessage);
    } finally {
      setTimeout(() => {
        setAuthLoading(false);
      }, 2000);
    }
  };

  const sidebarContent = (
    <Card
      borderRadius={0}
      variant="unstyled"
      display={!isLargeScreen || !user ? "none" : "block"}
    >
      <Flex direction="column" h="100vh" w="350px">
        <Flex
          px={3}
          pt={2}
          align="center"
          justify="space-between"
          fontSize="xl"
          fontWeight="semibold"
        >
          <Flex align="center" justify="start" gap={3}>
            <MenuItems
              user={user}
              switchAccount={handleGoogleSignIn}
              signOut={handleSignOut}
            />
            <Box
              lineHeight="1.2"
              maxW="200px"
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
            >
              <Text fontWeight="bold" fontSize="sm" isTruncated>
                {user?.displayName}
              </Text>
              <Text fontSize="xs" color="gray.400" isTruncated>
                {user?.email}
              </Text>
            </Box>
          </Flex>
          <Box>
            <NewChatButton />
            <Tooltip label="Settings">
              <IconButton
                aria-label="Settings"
                variant="ghost"
                icon={<IoSettingsSharp />}
              />
            </Tooltip>
          </Box>
        </Flex>
        <Flex p={3} align="center" justify="center">
          <SearchBar />
        </Flex>
        <Divider />
        <VStack
          h="100vh"
          p={3}
          align="stretch"
          overflowY={loading ? "hidden" : "auto"}
          spacing={0}
        >
          {loading ? (
            <SkeletonChatList />
          ) : (
            <Flex direction="column" align="center" justify="center" w="100%">
              <ConversationList conversations={conversations} />
            </Flex>
          )}
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
          <DrawerHeader
            px={3}
            py={2}
            pb={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Flex align="center" justify="start" gap={3}>
              <MenuItems
                user={user}
                switchAccount={handleGoogleSignIn}
                signOut={handleSignOut}
              />
              <Box
                textAlign="left"
                lineHeight="1.2"
                maxW="170px"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                <Text fontWeight="bold" fontSize="sm" isTruncated>
                  {user?.displayName}
                </Text>
                <Text fontSize="xs" color="gray.400" isTruncated>
                  {user?.email}
                </Text>
              </Box>
            </Flex>
            <Box>
              <NewChatButton />
              <SettingsButton />
            </Box>
          </DrawerHeader>
          <Flex px={3} pb={3}>
            <SearchBar />
          </Flex>
          {loading ? (
            <SkeletonChatList />
          ) : (
            <DrawerBody
              p={3}
              borderTopWidth="1px"
              overflowY={loading ? "hidden" : "auto"}
            >
              <ConversationList conversations={conversations} />
            </DrawerBody>
          )}
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBar;
