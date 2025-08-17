"use client";

import { forwardRef } from "react";
import {
  InputGroup as ChakraInputGroup,
  type InputGroupProps,
} from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>((props, ref) => {
  const { accentColor } = useAccentColor();
  return <ChakraInputGroup ref={ref} colorScheme={accentColor} {...props} />;
});

InputGroup.displayName = "InputGroup";

export default InputGroup;
