"use client";

import { 
  Box, 
  Flex, 
  IconButton, 
  VStack, 
  Divider, 
  Input, 
  Button, 
  InputGroup, 
  InputLeftElement, 
  Card, 
  useBreakpointValue, 
  Drawer, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  DrawerCloseButton 
} from "@chakra-ui/react";
import { IoSettingsSharp, IoCreateOutline } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { Fragment } from "react";

interface SideBarProps {
  type: "temporary" | "persistent";
  isOpen?: boolean;
  placement?: "left" | "right" | "top" | "bottom";
  onClose?: () => void;
};

const SideBarHeader = () => {
  return (
    <Flex p={0} align="center" justify="center">
      <InputGroup>
        <InputLeftElement>
          <CiSearch />
        </InputLeftElement>
        <Input type="search" placeholder="Search chats..." />
      </InputGroup>
      <IconButton aria-label="New Chat" variant="ghost" icon={<IoCreateOutline />} />
    </Flex>
  );
};

const SideBarBody = () => {
  return (
    <Fragment>
    <Button variant="ghost" w="100%" justifyContent="flex-start">
      <Box
        as="span"
        w="100%"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        display="block"
        textAlign="left"
      >
        These texts are asd adiasb
      </Box>
    </Button><Button variant="ghost" w="100%" justifyContent="flex-start">
      <Box
        as="span"
        w="100%"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        display="block"
        textAlign="left"
      >
        These texts are asd adiasb
      </Box>
    </Button><Button variant="ghost" w="100%" justifyContent="flex-start">
      <Box
        as="span"
        w="100%"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        display="block"
        textAlign="left"
      >
        These texts are asd adiasb
      </Box>
    </Button>
    </Fragment>
  );
};

const SideBarFooter = () => {
  return (
    <Button leftIcon={<IoSettingsSharp />} variant="ghost" w="100%" justifyContent="flex-start">
      Settings
    </Button>
  );
};

const SideBar = ({ type, isOpen, placement, onClose }: SideBarProps) => {
  const isLargeScreen = useBreakpointValue({ base: false, lg: true });

  if (type === "persistent" && !isLargeScreen) return null;

  return type === "persistent" ? (
    <Fragment>
      <Card borderRadius={0} variant="unstyled">
        <Flex direction="column" h="100vh" w="300px">
          <Flex p={3} align="center" justify="start" fontSize="xl" fontWeight="semibold">
            Chats
          </Flex>
          <Flex p={3} align="center" justify="center">
            <SideBarHeader />
          </Flex>
          <Divider />
            <VStack h="100vh" p={3} align="stretch" justify="start" overflowY="auto" spacing={0}>
            <Flex direction="column" align="center" justify="center" w="100%">
              <SideBarBody />
            </Flex>
          </VStack>
          <Divider />
          <Flex direction="column" p={3} align="center" justify="center">
            <SideBarFooter />
          </Flex>
        </Flex>
      </Card>
      <Divider orientation="vertical" />
    </Fragment>
  ) : (
    <Drawer isOpen={isOpen!} placement={placement!} onClose={onClose!} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <Card borderRadius={0} variant="unstyled" h="100vh">
          <DrawerCloseButton/>
          <DrawerHeader p={3}>
            Chats
          </DrawerHeader>
          <DrawerHeader p={3}>
            <SideBarHeader />
          </DrawerHeader>
          <DrawerBody p={3} borderBottomWidth="1px" borderTopWidth="1px">
            <SideBarBody />
          </DrawerBody>
          <DrawerFooter p={3}>
            <SideBarFooter />
          </DrawerFooter>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBar;
