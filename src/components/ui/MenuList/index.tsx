"use client";

import { forwardRef } from "react";
import {
  MenuList as ChakraMenuList,
  useColorMode,
  type MenuListProps,
} from "@chakra-ui/react";

const MenuList = forwardRef<HTMLDivElement, MenuListProps>((props, ref) => {
  const { colorMode } = useColorMode();

  return (
    <ChakraMenuList
      ref={ref}
      fontSize="md"
      bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
      {...props}
    />
  );
});

MenuList.displayName = "MenuList";

export default MenuList;
