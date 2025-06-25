import { FC, ReactNode } from "react";
import { Flex } from "@chakra-ui/react";

interface ThreadLayoutProps {
  children: ReactNode;
}

const ThreadLayout: FC<ThreadLayoutProps> = ({ children }) => {
  return (
    <Flex bgColor="background" direction="column" flex="1" h="100%">
      {children}
    </Flex>
  );
};

export default ThreadLayout;
