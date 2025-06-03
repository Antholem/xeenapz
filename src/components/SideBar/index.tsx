"use client";

import { FC, useEffect, useState, useCallback, ChangeEvent, memo } from "react";
import {
  Box,
  Flex,
  IconButton,
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
  getDocs,
} from "@/lib/firebase";
import { useRouter } from "next/navigation";
import ConversationList from "../ConversationList";
import useAuth from "@/stores/useAuth";

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
  messages?: Message[];
  [key: string]: any;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: { seconds: number; nanoseconds: number };
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
  const { user, setLoading: setAuthLoading } = useAuth();
  const router = useRouter();
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMessages = useCallback(
    async (convoId: string): Promise<Message[]> => {
      const q = query(
        collection(db, "conversations", convoId, "messages"),
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
      collection(db, "conversations"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convoList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const convo = { id: doc.id, ...doc.data() } as Conversation;
          const messages = await fetchMessages(doc.id);
          return { ...convo, messages };
        })
      );
      setConversations(convoList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, fetchMessages]);

  const handleSearch = (term: string) => setSearchTerm(term);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
      setAuthLoading(true);
    } finally {
      setTimeout(() => setAuthLoading(false), 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setAuthLoading(true);
      if (onClose) onClose();
    } finally {
      setTimeout(() => setAuthLoading(false), 2000);
    }
  };

  const content = (
    <Card
      borderRadius={0}
      variant="unstyled"
      h="100vh"
      display={!isLargeScreen ? "none" : "block"}
    >
      <Flex direction="column" h="100%" w="350px">
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
            <SettingsButton />
          </Box>
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
            <ConversationList
              conversations={conversations}
              searchTerm={searchTerm}
            />
          </Box>
        )}
      </Flex>
    </Card>
  );

  return type === "persistent" ? (
    <>
      {content}
      <Divider orientation="vertical" />
    </>
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
          {loading ? (
            <Flex flex="1" justify="center" align="center">
              <Spinner size="xl" />
            </Flex>
          ) : (
            <DrawerBody
              p={0}
              overflow="hidden"
              display="flex"
              borderTopWidth="1px"
            >
              <ConversationList
                conversations={conversations}
                searchTerm={searchTerm}
              />
            </DrawerBody>
          )}
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default memo(SideBar);
