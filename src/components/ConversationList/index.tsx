"use client";

import { FC, Fragment } from "react";
import { Button, Box } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";

interface Conversation {
  id: string;
  title?: string;
}

interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  convo,
  isActive,
  onClick,
}) => {
  return (
    <Button
      key={convo.id}
      variant={isActive ? "solid" : "ghost"}
      mb="1px"
      w="100%"
      justifyContent="flex-start"
      onClick={() => onClick(convo.id)}
      cursor="pointer"
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
        {convo.title}
      </Box>
    </Button>
  );
};

interface ConversationListProps {
  conversations: Conversation[];
}

const ConversationList: FC<ConversationListProps> = ({ conversations }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  return (
    <Fragment>
      {conversations
        .filter((convo) => convo.title)
        .map((convo) => (
          <ConversationItem
            key={convo.id}
            convo={convo}
            isActive={pathname === `/chat/${convo.id}`}
            onClick={handleConversationClick}
          />
        ))}
    </Fragment>
  );
};

export default ConversationList;
