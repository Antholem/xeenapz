import { cardAnatomy } from "@chakra-ui/anatomy";
import {
  extendTheme,
  type ThemeConfig,
  type ComponentStyleConfig,
} from "@chakra-ui/react";
import { COLOR_PALETTES } from "@/theme/color-tokens";
import { SEMANTIC_COLORS } from "@/theme/semantic-tokens";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
  cssVarPrefix: "ck",
};

const Card: ComponentStyleConfig = {
  parts: cardAnatomy.keys,
  baseStyle: {
    container: {
      bg: "surface",
      borderColor: "border",
      borderRadius: "md",
      boxShadow: "none",
    },
  },
};

const Divider = {
  baseStyle: {
    borderColor: "border",
  },
};

const theme = extendTheme({
  config,
  colors: COLOR_PALETTES,
  semanticTokens: SEMANTIC_COLORS,
  components: {
    Card,
    Divider,
  },
  styles: {
    global: () => ({
      body: {
        bg: "background",
        color: "primaryText",
      },
      "::-webkit-scrollbar": {
        width: "10px",
      },
      "::-webkit-scrollbar-thumb": {
        backgroundColor: "scrollbarThumb",
        borderRadius: "5px",
      },
      "::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "scrollbarThumbHover",
      },
    }),
  },
});

export default theme;
