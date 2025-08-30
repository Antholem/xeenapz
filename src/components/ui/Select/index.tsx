"use client";

import { forwardRef } from "react";
import {
  Select as ChakraSelect,
  type SelectProps,
  useColorMode,
} from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ focusBorderColor, ...props }, ref) => {
    const { accentColor } = useAccentColor();
    const { colorMode } = useColorMode();
    const computedFocusBorderColor =
      focusBorderColor ??
      (colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.400`);

    return (
      <ChakraSelect
        ref={ref}
        colorScheme={accentColor}
        focusBorderColor={computedFocusBorderColor}
        {...props}
      />
    );
  }
);

Select.displayName = "Select";

export default Select;
