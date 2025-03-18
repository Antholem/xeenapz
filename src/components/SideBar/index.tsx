"use client";

import { useState } from "react";
import { Box, Flex, IconButton, VStack, Divider } from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { IoSettingsSharp, IoCreateOutline } from "react-icons/io5";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Flex direction="column" h="100vh" bgColor="black" color="white">
      {/* Sidebar Toggle Button */}
      <Box alignSelf="flex-start" p={3}>
        <IconButton
          aria-label="Toggle Sidebar"
          variant="ghost"
          icon={<FiMenu />}
          onClick={() => setIsOpen(!isOpen)}
        />
      </Box>

      <Divider orientation="horizontal" />

      <Box alignSelf="flex-start" p={3}>
        <IconButton
          aria-label="New chat"
          variant="ghost"
          icon={<IoCreateOutline />} 
        />
      </Box>

      <Divider orientation="horizontal" />

      {/* Sidebar Content */}
      <VStack
        w={isOpen ? "240px" : "65px"}
        h="100vh"
        p={2}
        transition="width 0.3s ease-in-out"
        align="start"
        justify="start"
        overflowY="auto"
        overflowX="hidden"
      >
        
      </VStack>

      <Divider orientation="horizontal" />
      
      <Box alignSelf="flex-start" p={3}>
        <IconButton
          aria-label="Settings"
          variant="ghost"
          icon={<IoSettingsSharp />} 
        />
      </Box>
    </Flex>
  );
};

export default SideBar;
