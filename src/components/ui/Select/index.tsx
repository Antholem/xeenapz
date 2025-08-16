"use client";

import { FC } from "react";
import {
  Select as ChakraSelect,
  SelectProps,
  useColorMode,
} from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Select: FC<SelectProps> = ({ focusBorderColor, ...rest }) => {
  const { colorScheme } = useTheme();
  const { colorMode } = useColorMode();

  const computedFocusBorderColor =
    focusBorderColor ??
    (colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.400`);

  return <ChakraSelect focusBorderColor={computedFocusBorderColor} {...rest} />;
};

export default Select;
