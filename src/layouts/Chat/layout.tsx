import { FC, ReactNode } from "react";
import { Flex } from "@chakra-ui/react";

interface ChatLayoutProps {
  children: ReactNode;
}

const ChatLayout: FC<ChatLayoutProps> = ({ children }) => {
  return (
    <Flex direction="column" h="100%">
      {children}
    </Flex>
  );
};

export default ChatLayout;
