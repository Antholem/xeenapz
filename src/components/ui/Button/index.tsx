"use client";

import { forwardRef } from "react";
import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { accentColor } = useAccentColor();
  return <ChakraButton ref={ref} colorScheme={accentColor} {...props} />;
});

Button.displayName = "Button";

export default Button;
