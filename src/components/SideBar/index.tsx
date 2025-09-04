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
  useRef,
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
  Text,
  Tooltip,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FiLogOut, FiUserCheck } from "react-icons/fi";
import { IoAdd, IoSearch, IoSettingsSharp } from "react-icons/io5";

import { supabase } from "@/lib";
import { Spinner, Input, MenuList, MenuItem } from "@themed-components";
import {
  useAccentColor,
  useAuth,
  useToastStore,
  useTempThread,
  useThreadInput,
  useThreadMessages,
} from "@/stores";
import { ThreadList, Settings } from "@/components";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
}

interface MenuItemsProps {
  user: any;
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

const SettingsButton = ({ onClick }: { onClick: () => void }) => (
  <Tooltip label="Settings">
    <IconButton
      aria-label="Settings"
      variant="ghost"
      icon={<IoSettingsSharp />}
      onClick={onClick}
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
        src={user?.user_metadata?.avatar_url ?? "/default-avatar.png"}
        name={user?.user_metadata?.name ?? "User"}
      />
    </MenuButton>
    <MenuList>
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
  const { user, setLoading: setAuthLoading, loading: authLoading, setUser } =
    useAuth();
  const router = useRouter();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const { showToast } = useToastStore();
  const { accentColor, setAccentColor } = useAccentColor();
  const { setIsMessageTemporary } = useTempThread();
  const { clearInputs } = useThreadInput();
  const { clearMessages } = useThreadMessages();

  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();

  const hasFetchedRef = useRef(false);

  const startResizing = (e: ReactMouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => setIsResizing(false);

  const handleThreadSelect = useCallback(
    (threadId: string, messageId?: string) => {
      const url = messageId
        ? `/thread/${threadId}?messageId=${messageId}&scrollKey=${Date.now()}`
        : `/thread/${threadId}`;
      router.push(url);
      if (type === "temporary") {
        onClose?.();
      }
    },
    [router, type, onClose]
  );

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
      if (!user) return [];

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("thread_id", threadId)
        .order("timestamp", { ascending: true });

      return (data as Message[]) || [];
    },
    [user]
  );

  useEffect(() => {
    if (!user || hasFetchedRef.current) return;

    const fetchThreads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (!error && data) {
        const threadList = await Promise.all(
          data.map(async (row) => {
            const messages = await fetchMessages(row.id);
            return { ...(row as Thread), messages };
          })
        );
        setThreads(threadList);
      }

      setLoading(false);
      hasFetchedRef.current = true;
    };

    fetchThreads();
  }, [user, fetchMessages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`threads-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const updatedThread = payload.new as Thread;

          if (payload.eventType === "INSERT") {
            const messages = await fetchMessages(updatedThread.id);
            setThreads((prev) => [
              { ...updatedThread, messages },
              ...prev.filter((t) => t.id !== updatedThread.id),
            ]);
          }

          if (payload.eventType === "UPDATE") {
            const messages = await fetchMessages(updatedThread.id);
            setThreads((prev) =>
              prev.map((t) =>
                t.id === updatedThread.id
                  ? { ...t, ...updatedThread, messages }
                  : t
              )
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setThreads((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  const handleSearch = (term: string) => setSearchTerm(term);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
      router.push("/");
      setAuthLoading(true);
      showToast({
        id: `login-${Date.now()}`,
        title: "Welcome!",
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
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast({
        id: `logout-${Date.now()}`,
        title: "Signed out successfully",
        status: "info",
      });
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
      setIsMessageTemporary(false);
      clearInputs();
      clearMessages();
      localStorage.clear();
      setAccentColor("cyan");
      setUser(null);
      router.push("/");
      if (onClose) onClose();
      setTimeout(() => setAuthLoading(false), 2000);
    }
  };

  useEffect(() => {
    if (!user) {
      setThreads([]);
      setLoading(true);
      hasFetchedRef.current = false;
    }
  }, [user]);

  const content = (
    <Box display={!isLargeScreen ? "none" : "flex"} height="100dvh">
      <Card borderRadius={0} h="100dvh" w={`${sidebarWidth}px`}>
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
                  {user?.user_metadata?.name}
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
              <SettingsButton onClick={onSettingsOpen} />
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
              <ThreadList
                threads={threads}
                searchTerm={searchTerm}
                onThreadClick={handleThreadSelect}
              />
            </Box>
          )}
        </Flex>
      </Card>
      <Card
        w="3px"
        cursor="col-resize"
        onMouseDown={startResizing}
        _hover={{
          _light: { bg: `${accentColor}.500` },
          _dark: { bg: `${accentColor}.200` },
        }}
      />
    </Box>
  );

  if (authLoading || !user) return null;

  return (
    <>
      {type === "persistent" ? (
        <Fragment>
          {content}
          <Divider orientation="vertical" />
        </Fragment>
      ) : (
        <Drawer
          isOpen={!!isOpen}
          placement={placement!}
          onClose={onClose!}
          size="full"
          blockScrollOnMount={false}
        >
          <DrawerOverlay />
          <DrawerContent>
            <Card borderRadius={0} h="100dvh">
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
                      {user?.user_metadata?.name}
                    </Text>
                    <Text fontSize="xs" color="gray.400" isTruncated>
                      {user?.email}
                    </Text>
                  </Box>
                </Flex>
                <Box>
                  <NewChatButton />
                  <SettingsButton onClick={onSettingsOpen} />
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
                  <ThreadList
                    threads={threads}
                    searchTerm={searchTerm}
                    onThreadClick={handleThreadSelect}
                  />
                )}
              </DrawerBody>
            </Card>
          </DrawerContent>
        </Drawer>
      )}
      <Settings isOpen={isSettingsOpen} onClose={onSettingsClose} />
    </>
  );
};

export default memo(SideBar);
