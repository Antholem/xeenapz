"use client";

import { ReactNode } from "react";
import { Box, Flex } from "@chakra-ui/react";
import Providers from "./providers";
import { NavigationBar, SideBar } from "@/components";
import "./page.module.css";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>Xeenapz</title>
        <meta name="description" content="A chat application built with Next.js" />
      </head>
      <body>
        <Providers>
          <Flex h="100vh" overflow="hidden">
            <SideBar type="persistent" />
            <Flex direction="column" flex="1">
              <NavigationBar />
              <Box flex="1" overflow="auto">
                {children}
              </Box>
            </Flex>
          </Flex>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
