"use client";

import { FC } from "react";
import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Button: FC<ButtonProps> = (props) => {
  const { colorScheme } = useTheme();

  return <ChakraButton colorScheme={colorScheme} {...props} />;
};

export default Button;
