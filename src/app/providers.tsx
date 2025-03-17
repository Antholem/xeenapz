"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import theme from "@/lib/theme";

const Providers = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {children}
    </ChakraProvider>
  );
};

export default Providers;
