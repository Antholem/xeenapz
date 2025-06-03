"use client";

import { ReactNode } from "react";
import { Box, Flex } from "@chakra-ui/react";
import Providers from "./providers";
import { NavigationBar, SideBar, AuthInitializer } from "@/components";
import "./globals.css";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>Xeenapz</title>
        <meta
          name="description"
          content="A chat application built with Next.js"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <AuthInitializer>
            <Flex h="100vh" overflow="hidden">
              <SideBar type="persistent" />
              <Flex direction="column" flex="1">
                <NavigationBar />
                <Box as="main" flex="1" overflow="auto">
                  {children}
                </Box>
              </Flex>
            </Flex>
          </AuthInitializer>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
