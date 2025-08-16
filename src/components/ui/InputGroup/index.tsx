"use client";

import { forwardRef } from "react";
import { InputGroup as ChakraInputGroup, type InputGroupProps } from "@chakra-ui/react";
import { useTheme } from "@/stores";

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>((props, ref) => {
  const { colorScheme } = useTheme();
  return <ChakraInputGroup ref={ref} colorScheme={colorScheme} {...props} />;
});

InputGroup.displayName = "InputGroup";

export default InputGroup;
