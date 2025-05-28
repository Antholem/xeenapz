"use client";

import { FC, Fragment, ReactNode, memo, useMemo } from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { formatNormalTime } from "@/utils/dateFormatter";
import { Virtuoso } from "react-virtuoso";
import { ButtonProps } from "@chakra-ui/react";

interface Conversation {
  id: string;
  title?: string;
  messages?: Message[];
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

interface Message {
  id: string;
  text: string;
  createdAt?: string;
  timestamp?: { seconds: number; nanoseconds: number };
}

interface ConversationItemProps extends Omit<ButtonProps, "onClick"> {
  convo: Conversation;
  isActive: boolean;
  onConversationClick: (id: string) => void;
  isMessageMatch?: boolean;
  highlightedText?: ReactNode;
  isSearchActive: boolean;
}

const ConversationItem: FC<ConversationItemProps> = ({
  convo,
  isActive,
  onConversationClick,
  isMessageMatch = false,
  highlightedText,
  isSearchActive,
  ...props
}) => {
  return (
    <Button
      variant={isSearchActive ? "ghost" : isActive ? "solid" : "ghost"}
      w="100%"
      justifyContent="flex-start"
      onClick={() => onConversationClick(convo.id)}
      cursor="pointer"
      textAlign="left"
      py={isMessageMatch ? 6 : 0}
      {...props}
    >
      <Box
        as="span"
        w="100%"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        display="block"
        textAlign="left"
      >
        {isMessageMatch ? (
          <Fragment>
            {convo.title}
            {highlightedText}
          </Fragment>
        ) : (
          convo.title
        )}
      </Box>
    </Button>
  );
};

interface SearchResultItem {
  convo: Conversation;
  message?: Message;
  highlightedText?: ReactNode;
  createdAt?: number | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  searchTerm: string;
}

type VirtuosoItem =
  | { type: "title"; data: string }
  | {
      type: "message";
      data: {
        convo: Conversation;
        isMessageMatch: boolean;
        highlightedText?: ReactNode;
      };
    };

const ConversationList: FC<ConversationListProps> = ({
  conversations,
  searchTerm,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchActive = !!searchTerm;

  const { titleResults, messageResults } = useMemo(() => {
    const lower = searchTerm.toLowerCase();

    const titles = conversations
      .filter((c) => !searchTerm || c.title?.toLowerCase().includes(lower))
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    const messages: SearchResultItem[] = [];

    if (searchTerm) {
      conversations.forEach((convo) => {
        convo.messages?.forEach((msg) => {
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
                  color="gray.500"
                  w="100%"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  display="block"
                  textAlign="left"
                >
                  {msg.text.substring(0, start)}
                  <Box as="span" bgColor="blue.400" color="white">
                    {msg.text.substring(start, end)}
                  </Box>
                  {msg.text.substring(end)}
                </Box>
                {formatted && (
                  <Box as="span" fontSize="xs" color="gray.500">
                    {formatted}
                  </Box>
                )}
              </Flex>
            );

            messages.push({
              convo,
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
  }, [searchTerm, conversations]);

  const hasResults = titleResults.length > 0 || messageResults.length > 0;

  const allItems: VirtuosoItem[] = useMemo(() => {
    if (isSearchActive && hasResults) {
      const items: VirtuosoItem[] = [];

      if (titleResults.length > 0) {
        items.push({ type: "title", data: "Titles" });
        titleResults.forEach((convo) =>
          items.push({
            type: "message",
            data: { convo, isMessageMatch: false },
          })
        );
      }

      if (messageResults.length > 0) {
        items.push({ type: "title", data: "Messages" });
        messageResults.forEach((result) =>
          items.push({
            type: "message",
            data: {
              convo: result.convo,
              isMessageMatch: true,
              highlightedText: result.highlightedText,
            },
          })
        );
      }

      return items;
    }

    return conversations
      .filter((convo) => convo.title)
      .map((convo) => ({
        type: "message",
        data: { convo, isMessageMatch: false },
      }));
  }, [isSearchActive, hasResults, titleResults, messageResults, conversations]);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  return (
    <Box as="span" w="100%" h="100%">
      {isSearchActive && !hasResults ? (
        <Flex justify="center" align="center" h="100%" px={4}>
          <Text fontSize="sm" textAlign="center" color="gray.500">
            No results found.
          </Text>
        </Flex>
      ) : (
        <Virtuoso
          style={{ height: "100%" }}
          data={allItems}
          initialTopMostItemIndex={0}
          itemContent={(index, item) => {
            const isFirst = index === 0;
            const isLast = index === allItems.length - 1;

            if (item.type === "title") {
              return (
                <Box pt={item.data === "Titles" ? 3 : 5} pr={2} pl={7}>
                  <Text
                    fontSize="sm"
                    textAlign="left"
                    color="gray.500"
                    fontWeight="bold"
                  >
                    {item.data}
                  </Text>
                </Box>
              );
            }

            const { convo, isMessageMatch, highlightedText } = item.data;
            return (
              <Box mx={3}>
                <ConversationItem
                  convo={convo}
                  isActive={pathname === `/chat/${convo.id}`}
                  onConversationClick={handleConversationClick}
                  isMessageMatch={isMessageMatch}
                  highlightedText={highlightedText}
                  isSearchActive={isSearchActive}
                  mt={isFirst ? 3 : 0}
                  mb={isLast ? 3 : "1px"}
                />
              </Box>
            );
          }}
        />
      )}
    </Box>
  );
};

export default memo(ConversationList);
