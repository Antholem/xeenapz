"use client";

import { FC, Fragment, useState, useEffect, ReactNode } from "react";
import { Button, Box, Text, Flex } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { formatNormalTime } from "@/utils/dateFormatter";

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

interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  isMessageMatch?: boolean;
  highlightedText?: ReactNode;
  isSearchActive: boolean;
}

const ConversationItem: FC<ConversationItemProps> = ({
  convo,
  isActive,
  onClick,
  isMessageMatch = false,
  highlightedText,
  isSearchActive,
}) => {
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

      const titles = conversations
        .filter((convo) =>
          convo.title?.toLowerCase().includes(lowercasedSearchTerm)
        )
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setTitleResults(titles);

      const messages: SearchResultItem[] = [];
      conversations.forEach((convo) => {
        convo.messages?.forEach((message) => {
          if (message.text.toLowerCase().includes(lowercasedSearchTerm)) {
            const startIndex = message.text
              .toLowerCase()
              .indexOf(lowercasedSearchTerm);
            const endIndex = startIndex + searchTerm.length;
            const createdAtTimestamp = message.createdAt
              ? new Date(message.createdAt).getTime() / 1000
              : null;

            let formattedDate: string | null = null;

            if (createdAtTimestamp) {
              const date = new Date(createdAtTimestamp * 1000);
              formattedDate = formatNormalTime(date);
            }

            const highlightedTextWithDate = (
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
                  {message.text.substring(0, startIndex)}
                  <Box as="span" bgColor="blue.400" color="white">
                    {message.text.substring(startIndex, endIndex)}
                  </Box>
                  {message.text.substring(endIndex)}
                </Box>
                {formattedDate && (
                  <Box as="span" fontSize="xs" color="gray.500">
                    {formattedDate}
                  </Box>
                )}
              </Flex>
            );
            messages.push({
              convo,
              message,
              highlightedText: highlightedTextWithDate,
              createdAt: createdAtTimestamp,
            });
          }
        });
      });

      messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
          .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
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
