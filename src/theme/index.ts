import { cardAnatomy } from "@chakra-ui/anatomy";
import {
  extendTheme,
  type ThemeConfig,
  type ComponentStyleConfig,
} from "@chakra-ui/react";
import { COLOR_PALETTES } from "@/theme/color-tokens";

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
  semanticTokens: {
    colors: {
      background: {
        default: "#F9FAFB",
        _dark: "#0A0A0A",
      },
      surface: {
        default: "#FFFFFF",
        _dark: "#121212",
      },
      mutedSurface: {
        default: "#E5E5E5",
        _dark: "#262626",
      },
      primaryText: {
        default: "#1F2937",
        _dark: "#E5E5E5",
      },
      secondaryText: {
        default: "#6B7280",
        _dark: "#A3A3A3",
      },
      tertiaryText: {
        default: "#A3A3A3",
        _dark: "#D4D4D4",
      },
      border: {
        default: "#cacaca",
        _dark: "#565656",
      },
      scrollbarThumb: {
        default: "#A0A0A0",
        _dark: "#4C4C4C",
      },
      scrollbarThumbHover: {
        default: "#888888",
        _dark: "#666666",
      },
    },
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
  components: {
    Card,
    Divider,
  },
});

export default theme;
