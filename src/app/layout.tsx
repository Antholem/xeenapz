import { Box } from "@chakra-ui/react";
import { Providers } from "./providers";
import { NavigationBar } from "@/components";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Xeenapz</title>
        <meta
          name="description"
          content="A chat application built with Next.js"
        />
      </head>
      <body>
        <div id="root">
          <Providers>
            <NavigationBar />
            <Box pt="16">
              {children}
            </Box>
          </Providers>
        </div>
      </body>
    </html>
  );
};
