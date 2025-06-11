import {
  extendTheme,
  type ThemeConfig,
  type StyleFunctionProps,
} from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
  cssVarPrefix: "ck",
};

const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      background: {
        default: "gray.50",
        _dark: "gray.900",
      },
      text: {
        default: "black",
        _dark: "whiteAlpha.900",
      },
      cardBg: {
        default: "white",
        _dark: "gray.800",
      },
    },
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: "background",
        color: "text",
      },
    }),
  },
});

export default theme;
