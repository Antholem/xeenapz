"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ChakraProvider,
  ColorModeScript,
  useColorModeValue,
  useTheme,
  useToken,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import { transparentize } from "@chakra-ui/theme-tools";
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
  const chakraTheme = useTheme();

  const bgToken = useColorModeValue(`${accentColor}.500`, `${accentColor}.200`);
  const textToken = useColorModeValue("white", "gray.900");
  const textColor = useToken("colors", textToken);

  const background = transparentize(bgToken, 1.0)(chakraTheme);

  return (
    <Global styles={{ "::selection": { background, color: textColor } }} />
  );
};

export default Providers;
