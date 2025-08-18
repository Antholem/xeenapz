"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ChakraProvider,
  ColorModeScript,
  useColorMode,
  useToken,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { useAccentColor } from "@/stores";
import theme from "@/theme";

const Providers = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AccentSelection />
      {children}
    </ChakraProvider>
  );
};

const AccentSelection = () => {
  const { accentColor } = useAccentColor();
  const { colorMode } = useColorMode();
  const [lightBg, darkBg, white, black] = useToken("colors", [
    `${accentColor}.500`,
    `${accentColor}.300`,
    "white",
    "gray.900",
  ]);

  const background = colorMode === "dark" ? darkBg : lightBg;
  const color = colorMode === "dark" ? black : white;

  return <Global styles={{ "::selection": { background, color } }} />;
};

export default Providers;
