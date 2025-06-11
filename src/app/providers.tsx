"use client";

import { ReactNode, useEffect, useState } from "react";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "@/lib/theme";
import { ThemeColorProvider } from "@/lib/ColorSchemeContext";

const Providers = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ThemeColorProvider>{children}</ThemeColorProvider>
    </ChakraProvider>
  );
};

export default Providers;
