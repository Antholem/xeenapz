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
    const optionBg = colorMode === "dark" ? "gray.700" : "white";
    const optionHighlightBg =
      colorMode === "dark" ? `${accentColor}.600` : `${accentColor}.200`;
    const optionHighlightColor =
      colorMode === "dark" ? "white" : "gray.800";

    return (
      <ChakraSelect
        ref={ref}
        colorScheme={accentColor}
        focusBorderColor={computedFocusBorderColor}
        sx={{
          option: {
            backgroundColor: optionBg,
          },
          "option:checked, option:hover": {
            backgroundColor: optionHighlightBg,
            color: optionHighlightColor,
          },
        }}
        {...props}
      />
    );
  }
);

Select.displayName = "Select";

export default Select;
