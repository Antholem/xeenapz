"use client";

import { forwardRef } from "react";
import {
  MenuButton as ChakraMenuButton,
  Button as ChakraButton,
  type MenuButtonProps,
} from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>((props, ref) => {
  const { accentColor } = useAccentColor();
  return (
    <ChakraMenuButton
      ref={ref}
      as={ChakraButton}
      colorScheme={accentColor}
      {...props}
    />
  );
});

MenuButton.displayName = "MenuButton";

export default MenuButton;
