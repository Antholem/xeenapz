"use client";

import { Button as ButtonInput, ButtonProps } from "@chakra-ui/react";
import useTheme from "@/stores/useTheme";

const Button = (props: ButtonProps) => {
  const { colorScheme } = useTheme();

  return <ButtonInput colorScheme={colorScheme} {...props} />;
};

export default Button;
