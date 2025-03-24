"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import theme from "@/lib/theme";

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent rendering until the component is mounted (avoids hydration mismatch)
  if (!isMounted) return null;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {children}
    </ChakraProvider>
  );
};

export default Providers;
