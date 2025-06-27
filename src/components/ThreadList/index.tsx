"use client";

import {
  FC,
  Fragment,
  ReactNode,
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { Box, Text, Flex } from "@chakra-ui/react";
import { db, collection, query, orderBy, getDocs, where } from "@/lib";
import {
  DocumentData,
  limit,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { formatNormalTime } from "@/utils/dateFormatter";
import { Progress } from "@themed-components";
import { useAuth, useTheme } from "@/stores";
import { ThreadItem } from "@/components";

interface Thread {
  id: string;
  title?: string;
  messages?: Message[];
  updatedAt?: { seconds: number; nanoseconds: number } | null;
  isDeleted: boolean;
  isArchived: boolean;
}

interface Message {
  id: string;
  text: string;
  createdAt?: string;
  timestamp?: { seconds: number; nanoseconds: number };
}

interface SearchResultItem {
  thread: Thread;
  message?: Message;
  highlightedText?: ReactNode;
  createdAt?: number | null;
}

interface ThreadListProps {
  threads: Thread[];
  searchTerm: string;
}

type VirtuosoItem =
  | { type: "title"; data: string }
  | {
      type: "message";
      data: {
        thread: Thread;
        isMessageMatch: boolean;
        highlightedText?: ReactNode;
      };
    };

const ThreadList: FC<ThreadListProps> = ({ threads, searchTerm }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSearchActive = !!searchTerm;

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [loadedThreads, setLoadedThreads] = useState<Thread[]>([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [readyToRender, setReadyToRender] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);

  const { colorScheme } = useTheme();

  useEffect(() => {
    if (!isSearchActive) {
      setLoadedThreads(threads);
    }
  }, [threads, isSearchActive]);

  useEffect(() => {
    if (
      hasScrolledOnce ||
      isSearchActive ||
      !pathname ||
      loadedThreads.length === 0
    )
      return;

    const activeId = pathname.split("/").pop();
    const index = loadedThreads.findIndex((t) => t.id === activeId);

    if (index >= 0 && virtuosoRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          virtuosoRef.current?.scrollToIndex({
            index,
            align: "center",
            behavior: "auto",
          });

          setTimeout(() => {
            setReadyToRender(true);
            setHasScrolledOnce(true);
          }, 100);
        });
      });
    } else {
      setReadyToRender(true);
      setHasScrolledOnce(true);
    }
  }, [pathname, loadedThreads, isSearchActive, hasScrolledOnce]);

  const loadMoreThreads = useCallback(async () => {
    if (isSearchActive || isLoadingMoreThreads || !hasMoreThreads) return;

    setIsLoadingMoreThreads(true);

    try {
      const ref = collection(db, "threads");
      const threadQuery = lastDoc
        ? query(
            ref,
            where("userId", "==", user?.uid),
            orderBy("updatedAt", "desc"),
            startAfter(lastDoc),
            limit(20)
          )
        : query(
            ref,
            where("userId", "==", user?.uid),
            orderBy("updatedAt", "desc"),
            limit(20)
          );

      const snap = await getDocs(threadQuery);

      if (!snap.empty) {
        const newThreads = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Thread[];

        const newUniqueThreads = newThreads.filter(
          (t) => !loadedThreads.some((loaded) => loaded.id === t.id)
        );

        setLoadedThreads((prev) => [...prev, ...newUniqueThreads]);
        setLastDoc(snap.docs[snap.docs.length - 1]);

        if (newUniqueThreads.length < 20) setHasMoreThreads(false);
      } else {
        setHasMoreThreads(false);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setIsLoadingMoreThreads(false);
    }
  }, [
    hasMoreThreads,
    isLoadingMoreThreads,
    isSearchActive,
    lastDoc,
    loadedThreads,
    user?.uid,
  ]);

  const { titleResults, messageResults } = useMemo(() => {
    const lower = searchTerm.toLowerCase();

    const titles = loadedThreads
      .filter((t) => !searchTerm || t.title?.toLowerCase().includes(lower))
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    const messages: SearchResultItem[] = [];

    if (searchTerm) {
      loadedThreads.forEach((thread) => {
        thread.messages?.forEach((msg) => {
          if (msg.text.toLowerCase().includes(lower)) {
            const start = msg.text.toLowerCase().indexOf(lower);
            const end = start + searchTerm.length;

            const createdAt = msg.createdAt
              ? new Date(msg.createdAt).getTime() / 1000
              : null;

            const formatted = createdAt
              ? formatNormalTime(new Date(createdAt * 1000))
              : null;

            const highlight = (
              <Flex direction="row" justify="space-between" gap={1} mt={1}>
                <Box
                  as="span"
                  fontSize="xs"
                  color="secondaryText"
                  w="100%"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  display="block"
                  textAlign="left"
                >
                  {msg.text.substring(0, start)}
                  <Box as="span" bgColor={`${colorScheme}.400`} color="gray.50">
                    {msg.text.substring(start, end)}
                  </Box>
                  {msg.text.substring(end)}
                </Box>
                {formatted && (
                  <Box as="span" fontSize="xs" color="secondaryText">
                    {formatted}
                  </Box>
                )}
              </Flex>
            );

            messages.push({
              thread,
              message: msg,
              highlightedText: highlight,
              createdAt,
            });
          }
        });
      });

      messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return { titleResults: titles, messageResults: messages };
  }, [searchTerm, loadedThreads, colorScheme]);

  const hasResults = titleResults.length > 0 || messageResults.length > 0;

  const allItems: VirtuosoItem[] = useMemo(() => {
    const filteredThreads = loadedThreads.filter(
      (t) => !t.isArchived && t.isDeleted !== true
    );

    if (isSearchActive && hasResults) {
      const items: VirtuosoItem[] = [];

      if (titleResults.length > 0) {
        items.push({ type: "title", data: "Titles" });
        titleResults.forEach((thread) =>
          items.push({
            type: "message",
            data: { thread, isMessageMatch: false },
          })
        );
      }

      if (messageResults.length > 0) {
        items.push({ type: "title", data: "Messages" });
        messageResults.forEach((result) =>
          items.push({
            type: "message",
            data: {
              thread: result.thread,
              isMessageMatch: true,
              highlightedText: result.highlightedText,
            },
          })
        );
      }

      return items;
    }

    return filteredThreads
      .filter((t) => t.title)
      .map((thread) => ({
        type: "message",
        data: { thread, isMessageMatch: false },
      }));
  }, [isSearchActive, hasResults, titleResults, messageResults, loadedThreads]);

  const handleThreadClick = (threadId: string) => {
    router.push(`/thread/${threadId}`);
  };

  return (
    <Box as="span" w="100%" h="100%" position="relative">
      {isSearchActive && !hasResults ? (
        <Flex
          direction="column"
          justify="center"
          align="center"
          h="100%"
          px={6}
        >
          <Text fontSize="md" color="secondaryText" textAlign="center">
            No threads or messages match your search.
          </Text>
        </Flex>
      ) : loadedThreads.length === 0 ? (
        <Flex
          direction="column"
          justify="center"
          align="center"
          h="100%"
          px={6}
        >
          <Text fontSize="md" color="secondaryText" textAlign="center">
            You have no threads yet.
          </Text>
        </Flex>
      ) : (
        <Fragment>
          {isLoadingMoreThreads && hasScrolledOnce && readyToRender && (
            <Box position="absolute" top={0} left={0} right={0} zIndex={1}>
              <Progress size="xs" isIndeterminate />
            </Box>
          )}
          <Box
            h="100%"
            overflow={readyToRender ? "auto" : "hidden"}
            visibility={readyToRender ? "visible" : "hidden"}
            transition="opacity 0.2s ease"
          >
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: "100%" }}
              data={allItems}
              initialTopMostItemIndex={0}
              endReached={() => {
                if (hasScrolledOnce) loadMoreThreads();
              }}
              itemContent={(index, item) => {
                const isFirst = index === 0;
                const isLast = index === allItems.length - 1;

                if (item.type === "title") {
                  return (
                    <Box
                      mt={item.data === "Titles" ? 3 : 5}
                      mr={2}
                      ml={7}
                      mb={2}
                    >
                      <Text
                        fontSize="sm"
                        textAlign="left"
                        color="secondaryText"
                        fontWeight="bold"
                      >
                        {item.data}
                      </Text>
                    </Box>
                  );
                }

                const { thread, isMessageMatch, highlightedText } = item.data;
                return (
                  <Box mx={3} pt={isFirst ? 3 : 0} pb={isLast ? 3 : 0}>
                    <ThreadItem
                      thread={thread}
                      isActive={pathname === `/thread/${thread.id}`}
                      onThreadClick={handleThreadClick}
                      isMessageMatch={isMessageMatch}
                      highlightedText={highlightedText}
                      isSearchActive={isSearchActive}
                      mt={isFirst ? 3 : 0.4}
                      mb={isLast ? 3 : 0.4}
                      onDeleteThread={(deletedId) => {
                        setLoadedThreads((prev) =>
                          prev.filter((t) => t.id !== deletedId)
                        );
                      }}
                    />
                  </Box>
                );
              }}
            />
          </Box>
        </Fragment>
      )}
    </Box>
  );
};

export default memo(ThreadList);
