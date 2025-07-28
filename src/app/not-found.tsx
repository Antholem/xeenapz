"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flex, Text } from "@chakra-ui/react";
import { ThreadLayout } from "@/layouts";
import { MessageInput } from "@/components";
import { Button } from "@themed-components";
import { IoAdd } from "react-icons/io5";

const NotFound = () => {
  const router = useRouter();
  const noop = (_?: any) => {};

  return (
    <ThreadLayout>
      <Flex
        flex="1"
        direction="column"
        justify="center"
        align="center"
        h="100%"
        overflow="hidden"
        gap={4}
      >
        <Flex direction="column" justify="center">
          <Text fontSize="3xl" align="center">
            Page Not Found
          </Text>
          <Text fontSize="md" align="center">
            Sorry, the page you&apos;re looking for doesn&apos;t exist.
          </Text>
        </Flex>
        <Button onClick={() => router.push("/")} leftIcon={<IoAdd />}>
          New Chat
        </Button>
      </Flex>
      <MessageInput
        isDisabled={true}
        input={""}
        setInput={noop}
        isListening={false}
        resetTranscript={noop}
        isFetchingResponse={false}
        sendMessage={noop}
      />
    </ThreadLayout>
  );
};

export default NotFound;
