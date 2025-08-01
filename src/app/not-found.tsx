"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flex, Text, Button } from "@chakra-ui/react";

const NotFound = () => {
  const router = useRouter();
  return (
    <Flex direction="column" align="center" justify="center" h="100vh" gap={4}>
      <Flex direction="column" align="center">
        <Text fontSize="3xl">Page Not Found</Text>
        <Text fontSize="md">Sorry, the page you&apos;re looking for doesn&apos;t exist.</Text>
      </Flex>
      <Button onClick={() => router.push("/")}>New Chat</Button>
    </Flex>
  );
};

export default NotFound;
