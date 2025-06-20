import { FC, ReactNode } from "react";
import { Flex } from "@chakra-ui/react";

interface ConversationLayoutProps {
  children: ReactNode;
}

const ConversationLayout: FC<ConversationLayoutProps> = ({ children }) => {
  return (
    <Flex bgColor="background" direction="column" flex="1" h="100%">
      {children}
    </Flex>
  );
};

export default ConversationLayout;
