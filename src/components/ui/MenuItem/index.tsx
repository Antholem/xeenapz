"use client";

import { forwardRef } from "react";
import { MenuItem as ChakraMenuItem, type MenuItemProps } from "@chakra-ui/react";

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => (
  <ChakraMenuItem
    ref={ref}
    bgColor="transparent"
    _hover={{ bgColor: "transparent" }}
    _active={{ bgColor: "transparent" }}
    _focus={{ bgColor: "transparent" }}
    {...props}
  />
));

MenuItem.displayName = "MenuItem";

export default MenuItem;
