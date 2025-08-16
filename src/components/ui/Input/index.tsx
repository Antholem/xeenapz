"use client";

import { FC, ReactNode } from "react";
import {
  Input as ChakraInput,
  InputProps,
  useColorMode,
} from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

interface CustomInputProps extends InputProps {
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

const Input: FC<CustomInputProps> = ({
  leftElement,
  rightElement,
  pl,
  pr,
  focusBorderColor,
  ...rest
}) => {
  const { accentColor } = useAccentColor();
  const { colorMode } = useColorMode();

  const computedFocusBorderColor =
    focusBorderColor ??
    (colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.400`);

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
