"use client";

import { forwardRef } from "react";
import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { colorScheme } = useTheme();
  return <ChakraButton ref={ref} colorScheme={colorScheme} {...props} />;
});

export default Button;
