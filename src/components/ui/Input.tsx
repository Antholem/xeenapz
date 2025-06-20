"use client";

import {
  Input as ChakraInput,
  InputProps,
  useColorMode,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import useTheme from "@/stores/useTheme";

interface CustomInputProps extends InputProps {
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

const Input = ({
  leftElement,
  rightElement,
  pl,
  pr,
  focusBorderColor,
  ...rest
}: CustomInputProps) => {
  const { colorScheme } = useTheme();
  const { colorMode } = useColorMode();

  const computedFocusBorderColor =
    focusBorderColor ??
    (colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.400`);

  return (
    <ChakraInput
      focusBorderColor={computedFocusBorderColor}
      pl={leftElement ? "2.5rem" : pl}
      pr={rightElement ? "2.5rem" : pr}
      {...rest}
    />
  );
};

export default Input;
