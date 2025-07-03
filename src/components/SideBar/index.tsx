"use client";

import {
  FC,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useState,
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { Thread, Message } from "@/types/thread";
import {
  Avatar,
  Box,
  Card,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiLogOut, FiUserCheck } from "react-icons/fi";
import { IoAdd, IoSearch, IoSettingsSharp } from "react-icons/io5";

import {
  auth,
  collection,
  db,
  getDocs,
  onSnapshot,
  orderBy,
  provider,
  query,
  signInWithPopup,
  signOut,
  User,
  where,
} from "@/lib";
import { Spinner, Input } from "@themed-components";
import { useAuth, useToastStore } from "@/stores";
import { ThreadList } from "@/components";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
}

interface MenuItemsProps {
  user: User | null;
  switchAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const NewChatButton = () => {
  const router = useRouter();
  return (
    <Tooltip label="New chat">
      <IconButton
        aria-label="New Chat"
        variant="ghost"
        icon={<IoAdd />}
        onClick={() => router.push("/")}
        cursor="pointer"
      />
    </Tooltip>
  );
};

const SettingsButton = () => (
  <Tooltip label="Settings">
    <IconButton
      aria-label="Settings"
      variant="ghost"
      icon={<IoSettingsSharp />}
    />
  </Tooltip>
);

const SearchBar = ({ onSearch }: { onSearch: (term: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <InputGroup>
      <InputLeftElement>
        <IoSearch />
      </InputLeftElement>
      <Input
        leftElement
        type="search"
        placeholder="Search titles, messages..."
        variant="filled"
        value={searchTerm}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setSearchTerm(e.target.value);
          onSearch(e.target.value);
        }}
      />
    </InputGroup>
  );
};

const MenuItems: FC<MenuItemsProps> = ({ user, switchAccount, signOut }) => (
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
    <MenuList fontSize="md">
      <MenuItem onClick={switchAccount} icon={<Icon as={FiUserCheck} />}>
        Switch Account
      </MenuItem>
      <MenuItem onClick={signOut} icon={<Icon as={FiLogOut} />}>
        Log out
      </MenuItem>
    </MenuList>
  </Menu>
);

const SideBar: FC<SideBarProps> = ({ type, isOpen, placement, onClose }) => {
  const { user, setLoading: setAuthLoading, loading: authLoading } = useAuth();
  const router = useRouter();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const { showToast } = useToastStore();

  const startResizing = (e: ReactMouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => setIsResizing(false);

  const handleResizing = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(200, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizing);
      document.addEventListener("mouseup", stopResizing);
    } else {
      document.removeEventListener("mousemove", handleResizing);
      document.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      document.removeEventListener("mousemove", handleResizing);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, handleResizing]);

  const fetchMessages = useCallback(
    async (threadId: string): Promise<Message[]> => {
      const q = query(
        collection(db, "threads", threadId, "messages"),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
    },
    []
  );

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "threads"),
      where("userId", "==", user.uid),
      where("isDeleted", "==", false),
      where("isArchived", "==", false),
      orderBy("isPinned", "desc"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const threadList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const thread = { id: doc.id, ...doc.data() } as Thread;
          const messages = await fetchMessages(doc.id);
          return { ...thread, messages };
        })
      );
      setThreads(threadList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, fetchMessages]);

  const handleSearch = (term: string) => setSearchTerm(term);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth!, provider);
      router.push("/");
      setAuthLoading(true);

      showToast({
        id: `login-${Date.now()}`,
        title: `Welcome, ${auth?.currentUser?.displayName || "User"}!`,
        status: "success",
      });
    } catch (error) {
      showToast({
        id: `login-error-${Date.now()}`,
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        status: "error",
      });
    } finally {
      setTimeout(() => setAuthLoading(false), 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth!);
      router.push("/");
      setAuthLoading(true);

      showToast({
        id: `logout-${Date.now()}`,
        title: "Signed out successfully",
        status: "info",
      });

      if (onClose) onClose();
    } catch (error) {
      showToast({
        id: `logout-error-${Date.now()}`,
        title: "Logout failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        status: "error",
      });
    } finally {
      setTimeout(() => setAuthLoading(false), 2000);
    }
  };

  const content = (
    <Box display={!isLargeScreen ? "none" : "flex"} height="100vh">
      <Card borderRadius={0} h="100vh" w={`${sidebarWidth}px`}>
        <Flex direction="column" h="100%">
          <Flex
            px={3}
            pt={2}
            align="center"
            justify="space-between"
            fontSize="xl"
            fontWeight="semibold"
            gap={2}
            minW={0}
          >
            <Flex align="center" justify="start" flex="1" gap={3} minW={0}>
              <MenuItems
                user={user}
                switchAccount={handleGoogleSignIn}
                signOut={handleSignOut}
              />
              <Box
                lineHeight="1.2"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                minW={0}
              >
                <Text fontWeight="bold" fontSize="sm" isTruncated maxW="100%">
                  {user?.displayName}
                </Text>
                <Text
                  fontSize="xs"
                  color="secondaryText"
                  isTruncated
                  maxW="100%"
                >
                  {user?.email}
                </Text>
              </Box>
            </Flex>
            <Flex flexShrink={0}>
              <NewChatButton />
              <SettingsButton />
            </Flex>
          </Flex>
          <Flex p={3}>
            <SearchBar onSearch={handleSearch} />
          </Flex>
          <Divider />
          {loading ? (
            <Flex flex="1" justify="center" align="center">
              <Spinner size="xl" />
            </Flex>
          ) : (
            <Box flex="1" overflow="hidden">
              <ThreadList threads={threads} searchTerm={searchTerm} />
            </Box>
          )}
        </Flex>
      </Card>
      <Card
        w="3px"
        cursor="col-resize"
        onMouseDown={startResizing}
        _hover={{ bg: "tertiaryText" }}
      />
    </Box>
  );

  if (authLoading || !user) return null;

  return type === "persistent" ? (
    <Fragment>
      {content}
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
        <Card borderRadius={0} h="100vh">
          <DrawerHeader
            px={3}
            py={2}
            pb={3}
            display="flex"
            justifyContent="space-between"
          >
            <Flex align="center" justify="start" gap={3}>
              <MenuItems
                user={user}
                switchAccount={handleGoogleSignIn}
                signOut={handleSignOut}
              />
              <Box
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
            <SearchBar onSearch={handleSearch} />
          </Flex>
          <DrawerBody
            p={0}
            overflow="hidden"
            display="flex"
            borderTopWidth="1px"
          >
            {loading ? (
              <Flex flex="1" justify="center" align="center">
                <Spinner size="xl" />
              </Flex>
            ) : (
              <ThreadList threads={threads} searchTerm={searchTerm} />
            )}
          </DrawerBody>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default memo(SideBar);
