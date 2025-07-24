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
import type { Thread, Message } from "@/types/thread";
import { Box, Text, Flex } from "@chakra-ui/react";
import { supabase } from "@/lib/supabase/client";
import { formatNormalTime } from "@/utils/dateFormatter";
import { Progress } from "@themed-components";
import { useAuth, useTheme } from "@/stores";
import { ThreadItem } from "@/components";

interface SearchResultItem {
  thread: Thread;
  message?: Message;
  highlightedText?: ReactNode;
  created_at?: number | null;
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
  const [lastIndex, setLastIndex] = useState<number>(0);
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [readyToRender, setReadyToRender] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);

  const { colorScheme } = useTheme();

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
    if (!user || isSearchActive || isLoadingMoreThreads || !hasMoreThreads)
      return;

    setIsLoadingMoreThreads(true);

    try {
      const from = lastIndex;

      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .range(from, from + 19);

      if (error) throw error;

      if (data && data.length > 0) {
        const newThreads = data as Thread[];
        const newUniqueThreads = newThreads.filter(
          (t) => !loadedThreads.some((loaded) => loaded.id === t.id)
        );
        setLoadedThreads((prev) => [...prev, ...newUniqueThreads]);
        setLastIndex(from + newThreads.length);
        if (newThreads.length < 20) setHasMoreThreads(false);
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
    lastIndex,
    loadedThreads,
    user,
  ]);

  useEffect(() => {
    if (!user) return;

    const sortThreads = (list: Thread[]) =>
      list.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });

    const channel = supabase
      .channel(`threads-list-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newThread = payload.new as Thread;

          if (payload.eventType === "INSERT") {
            const messages = await fetchMessages(newThread.id);
            setLoadedThreads((prev) =>
              sortThreads([
                { ...newThread, messages },
                ...prev.filter((t) => t.id !== newThread.id),
              ])
            );
          } else if (payload.eventType === "UPDATE") {
            setLoadedThreads((prev) =>
              sortThreads(
                prev.map((t) =>
                  t.id === newThread.id ? { ...t, ...newThread } : t
                )
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setLoadedThreads((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

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

            const createdAt = msg.created_at
              ? new Date(msg.created_at).getTime() / 1000
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
              created_at: createdAt,
            });
          }
        });
      });

      messages.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    }

    return { titleResults: titles, messageResults: messages };
  }, [searchTerm, loadedThreads, colorScheme]);

  const hasResults = titleResults.length > 0 || messageResults.length > 0;

  const allItems: VirtuosoItem[] = useMemo(() => {
    const filteredThreads = loadedThreads.filter(
      (t) => !t.is_archived && t.is_deleted !== true
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
