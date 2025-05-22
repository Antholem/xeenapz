"use client";

import {
  FC,
  Fragment,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  UIEvent,
  useRef,
  memo,
} from "react";
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
  Progress,
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
import { useAuth } from "@/app/context/Auth";
import { useRouter } from "next/navigation";
import ConversationList from "../ConversationList";

type LoadPreference = "fast" | "balanced" | "slow" | number;
interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
  loadPreference?: LoadPreference;
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

const SearchBar = ({
  onSearch,
}: {
  onSearch: (searchTerm: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

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
        onChange={handleInputChange}
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

const SideBar = ({
  type,
  isOpen,
  placement,
  onClose,
  loadPreference = "balanced",
}: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });
  const { user, setLoading: setAuthLoading } = useAuth();
  const router = useRouter();
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [displayedConversations, setDisplayedConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreConversations, setLoadingMoreConversations] =
    useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getLoadCounts = useCallback((preference: LoadPreference) => {
    if (typeof preference === "number") {
      return {
        initial: Math.max(20, preference),
        more: Math.max(10, Math.ceil(preference / 2)),
      };
    }
    switch (preference) {
      case "fast":
        return { initial: 40, more: 10 };
      case "slow":
        return { initial: 20, more: 10 };
      case "balanced":
      default:
        return { initial: 30, more: 10 };
    }
  }, []);

  const {
    initial: CONVERSATIONS_INITIAL_LOAD_COUNT,
    more: CONVERSATIONS_LOAD_MORE_COUNT,
  } = getLoadCounts(loadPreference);

  const fetchConversationMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      const messagesCollectionRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
      );
      const messagesQuery = query(
        messagesCollectionRef,
        orderBy("timestamp", "asc")
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      return messagesSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
    },
    []
  );

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
        async (snapshot) => {
          const conversationsList: Conversation[] = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const conversation = {
                id: doc.id,
                ...doc.data(),
              } as Conversation;
              const messages = await fetchConversationMessages(doc.id);
              return { ...conversation, messages };
            })
          );
          setAllConversations(conversationsList);
          setDisplayedConversations(
            conversationsList.slice(0, CONVERSATIONS_INITIAL_LOAD_COUNT)
          );
          setHasMoreConversations(
            conversationsList.length > CONVERSATIONS_INITIAL_LOAD_COUNT
          );
          setLoading(false);
        },
        (error) => {
          console.error("Error listening for conversations:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setAllConversations([]);
      setDisplayedConversations([]);
      setLoading(false);
      setHasMoreConversations(false);
    }
  }, [user, fetchConversationMessages, CONVERSATIONS_INITIAL_LOAD_COUNT]);

  useEffect(() => {
    if (!searchTerm) {
      setDisplayedConversations(
        allConversations.slice(0, CONVERSATIONS_INITIAL_LOAD_COUNT)
      );
      setHasMoreConversations(
        allConversations.length > CONVERSATIONS_INITIAL_LOAD_COUNT
      );
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const results = allConversations.filter((conversation) => {
        const titleMatch = conversation.title
          ?.toLowerCase()
          .includes(lowercasedSearchTerm);
        const messageMatch = conversation.messages?.some((message) =>
          message.text.toLowerCase().includes(lowercasedSearchTerm)
        );
        return titleMatch || messageMatch;
      });
      setDisplayedConversations(results);
      setHasMoreConversations(false);
    }
  }, [searchTerm, allConversations, CONVERSATIONS_INITIAL_LOAD_COUNT]);

  const loadMoreConversations = useCallback(() => {
    if (loadingMoreConversations || !hasMoreConversations) {
      return;
    }

    setLoadingMoreConversations(true);

    setTimeout(() => {
      const currentLoadedCount = displayedConversations.length;
      const nextBatch = allConversations.slice(
        currentLoadedCount,
        currentLoadedCount + CONVERSATIONS_LOAD_MORE_COUNT
      );

      setDisplayedConversations((prev) => [...prev, ...nextBatch]);
      setHasMoreConversations(
        allConversations.length > currentLoadedCount + nextBatch.length
      );
      setLoadingMoreConversations(false);
    }, 500);
  }, [
    loadingMoreConversations,
    hasMoreConversations,
    displayedConversations,
    allConversations,
    CONVERSATIONS_LOAD_MORE_COUNT,
  ]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (searchTerm) return;

    const target = event.currentTarget;
    const atBottomThreshold = 50;
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight <
      atBottomThreshold
    ) {
      loadMoreConversations();
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

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
      h="100vh"
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
          <SearchBar onSearch={handleSearch} />
        </Flex>
        <Divider />
        {loadingMoreConversations && searchTerm === "" && (
          <Progress size="xs" isIndeterminate />
        )}
        <VStack
          flex="1"
          p={3}
          align="stretch"
          overflowY="auto"
          spacing={0}
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {loading ? (
            <SkeletonChatList />
          ) : (
            <Flex direction="column" align="center" justify="center" w="100%">
              <ConversationList
                conversations={displayedConversations}
                searchTerm={searchTerm}
              />
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
            <SearchBar onSearch={handleSearch} />
          </Flex>
          {loadingMoreConversations && searchTerm === "" && (
            <Progress size="xs" isIndeterminate />
          )}
          {loading ? (
            <SkeletonChatList />
          ) : (
            <DrawerBody
              flex="1"
              p={3}
              borderTopWidth="1px"
              overflowY="auto"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <ConversationList
                conversations={displayedConversations}
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
