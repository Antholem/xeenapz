"use client";

import { FC, Fragment, useState, useEffect } from "react";
import { Button, Box, Text, Flex } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import {
  format,
  isToday,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
} from "date-fns";

interface Conversation {
  id: string;
  title?: string;
  messages?: Message[];
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

interface Message {
  id: string;
  text: string;
  timestamp?: { seconds: number; nanoseconds: number };
}

interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  isMessageMatch?: boolean;
  highlightedText?: React.ReactNode;
  isSearchActive: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  convo,
  isActive,
  onClick,
  isMessageMatch = false,
  highlightedText,
  isSearchActive,
}) => {
  const latestMessageTimestampSeconds = convo.messages?.[0]?.timestamp?.seconds;
  const conversationUpdatedAtSeconds = convo.updatedAt?.seconds;
  const displayTimestampSeconds =
    latestMessageTimestampSeconds || conversationUpdatedAtSeconds;

  let formattedTime: string | null = null;

  if (displayTimestampSeconds) {
    const date = new Date(displayTimestampSeconds * 1000);
    const now = new Date();
    const hoursAgo = differenceInHours(now, date);
    const daysAgo = differenceInDays(now, date);
    const weeksAgo = differenceInWeeks(now, date);

    if (hoursAgo < 24 && isToday(date)) {
      formattedTime = format(date, "hh:mmaaa");
    } else if (daysAgo < 7) {
      formattedTime = format(date, "EEE");
    } else if (weeksAgo < 52) {
      formattedTime = format(date, "d MMM");
    } else {
      formattedTime = format(date, "d MMM yyyy");
    }
  }

  return (
    <Button
      key={convo.id + (isMessageMatch ? `-${convo.messages?.[0]?.id}` : "")}
      variant={isSearchActive ? "ghost" : isActive ? "solid" : "ghost"}
      mb="1px"
      w="100%"
      justifyContent="flex-start"
      onClick={() => onClick(convo.id)}
      cursor="pointer"
      textAlign="left"
      py={isMessageMatch ? 6 : 0}
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
            <br />
            {highlightedText}
          </Fragment>
        ) : (
          convo.title
        )}
      </Box>
      <Box>
        {!isMessageMatch && formattedTime && (
          <Text fontSize="xs" color="gray.500" textAlign="right" w="30%">
            {formattedTime}
          </Text>
        )}
      </Box>
    </Button>
  );
};

interface SearchResultItem {
  convo: Conversation;
  message?: Message;
  highlightedText?: React.ReactNode;
}

interface ConversationListProps {
  conversations: Conversation[];
  searchTerm: string;
}

const ConversationList: FC<ConversationListProps> = ({
  conversations,
  searchTerm,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [titleResults, setTitleResults] = useState<Conversation[]>([]);
  const [messageResults, setMessageResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    if (searchTerm) {
      setIsSearchActive(true);
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const titles = conversations.filter((convo) =>
        convo.title?.toLowerCase().includes(lowercasedSearchTerm)
      );
      setTitleResults(titles);

      const messages: SearchResultItem[] = [];
      conversations.forEach((convo) => {
        convo.messages?.forEach((message) => {
          if (message.text.toLowerCase().includes(lowercasedSearchTerm)) {
            const startIndex = message.text
              .toLowerCase()
              .indexOf(lowercasedSearchTerm);
            const endIndex = startIndex + searchTerm.length;
            const highlightedText = (
              <Box as="span" fontSize="xs" color="gray.500">
                {message.text.substring(0, startIndex)}
                <Box as="span" fontWeight="bold">
                  {message.text.substring(startIndex, endIndex)}
                </Box>
                {message.text.substring(endIndex)}
              </Box>
            );
            messages.push({ convo, message, highlightedText });
          }
        });
      });
      setMessageResults(messages);
    } else {
      setIsSearchActive(false);
      setTitleResults([]);
      setMessageResults([]);
    }
  }, [conversations, searchTerm]);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const hasResults = titleResults.length > 0 || messageResults.length > 0;

  return (
    <Box as="span" w="100%">
      {isSearchActive ? (
        hasResults ? (
          <Flex direction="column" gap={5}>
            {titleResults.length > 0 && (
              <Box>
                <Box px={4} pb={1}>
                  <Text
                    fontSize="md"
                    textAlign="left"
                    color="gray.500"
                    fontWeight="bold"
                  >
                    Titles
                  </Text>
                </Box>
                <Box>
                  {titleResults.map((convo) => (
                    <ConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={pathname === `/chat/${convo.id}`}
                      onClick={handleConversationClick}
                      isSearchActive={isSearchActive}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {messageResults.length > 0 && (
              <Box>
                <Box px={4} pb={1}>
                  <Text
                    fontSize="md"
                    textAlign="left"
                    color="gray.500"
                    fontWeight="bold"
                  >
                    Messages
                  </Text>
                </Box>
                <Box>
                  {messageResults.map((result) => (
                    <ConversationItem
                      key={result.convo.id + `-${result.message?.id}`}
                      convo={result.convo}
                      isActive={pathname === `/chat/${result.convo.id}`}
                      onClick={handleConversationClick}
                      isMessageMatch={true}
                      highlightedText={result.highlightedText}
                      isSearchActive={isSearchActive}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Flex>
        ) : (
          <Text fontSize="sm" textAlign="center" color="gray.500">
            No results found.
          </Text>
        )
      ) : (
        conversations
          .filter((convo) => convo.title)
          .map((convo) => (
            <ConversationItem
              key={convo.id}
              convo={convo}
              isActive={pathname === `/chat/${convo.id}`}
              onClick={handleConversationClick}
              isSearchActive={isSearchActive}
            />
          ))
      )}
    </Box>
  );
};

export default ConversationList;
