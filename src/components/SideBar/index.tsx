"use client";

import { Box, Flex, IconButton, VStack, Divider, Input, Button, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { IoSettingsSharp, IoCreateOutline } from "react-icons/io5";
import { CiSearch } from "react-icons/ci";

const SideBar = () => {

  return (
    <>
      <Flex direction="column" h="100vh" w="250px">
        {/* Sidebar Toggle Button */}
        <Flex direction="row" p={3} align="center" justify="center">
          <InputGroup>
            <InputLeftElement>
              <CiSearch />
            </InputLeftElement>
            <Input 
              type="search" 
              placeholder="Search chats..."
            />
          </InputGroup>
          <IconButton
            aria-label="Search"
            variant="ghost"
            icon={<IoCreateOutline />}
          />
        </Flex>

        <Divider orientation="horizontal" />

        {/* Sidebar Content */}
        <VStack
          h="100vh"
          p={3}
          align="stretch"
          justify="start"
          overflowY="auto"
          spacing={0}
        >
          <Flex align="center" justify="center" w="100%">
            <Button
              variant="ghost"
              w="100%"
              justifyContent="flex-start"
            >
              <Box
                as="span"
                w="100%"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                display="block"
              >
                These texts are too long and it will be truncated
              </Box>
            </Button>
          </Flex>
        </VStack>

        <Divider orientation="horizontal" />

        <Flex p={3} align="center" justify="center">
          <Button leftIcon={<IoSettingsSharp />} variant="ghost" w="100%" justifyContent="flex-start">
            Settings
          </Button>
        </Flex>
      </Flex>

      <Divider orientation="vertical" />
    </>
  );
};

export default SideBar;
