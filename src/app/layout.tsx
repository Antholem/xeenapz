import { Box, Flex } from "@chakra-ui/react";
import Providers from "./providers";
import { NavigationBar } from "@/components";
import { ReactNode } from "react";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>Xeenapz</title>
        <meta name="description" content="A chat application built with Next.js" />
      </head>
      <body>
        <div id="root">
          <Providers>
            <NavigationBar />
            <Flex 
              pt="16"
              minH="calc(100vh - 4rem)"
              justify="center"
              align="center"
            >
              <Box width="100%" maxW="600px" px={4}>
                {children}
              </Box>
            </Flex>
          </Providers>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
