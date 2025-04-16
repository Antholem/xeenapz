import { FC, ReactNode } from "react";
import { Flex } from "@chakra-ui/react";

interface ConversationLayoutProps {
  children: ReactNode;
}

const ConversationLayout: FC<ConversationLayoutProps> = ({ children }) => {
  return (
    <Flex direction="column" h="100%">
      {children}
    </Flex>
  );
};

export default ConversationLayout;
