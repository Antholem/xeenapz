"use client";

import { forwardRef } from "react";
import {
  MenuItem as ChakraMenuItem,
  useColorMode,
  type MenuItemProps,
} from "@chakra-ui/react";

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => {
  const { colorMode } = useColorMode();

  return (
    <ChakraMenuItem
      ref={ref}
      bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
      _hover={{
        bgColor: colorMode === "dark" ? "gray.800" : "gray.100",
      }}
      _active={{
        bgColor: colorMode === "dark" ? "gray.700" : "gray.200",
      }}
      _focus={{
        bgColor: colorMode === "dark" ? "gray.700" : "gray.100",
      }}
      {...props}
    />
  );
});

MenuItem.displayName = "MenuItem";

export default MenuItem;
