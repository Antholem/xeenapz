"use client";

import { forwardRef } from "react";
import {
  Select as ChakraSelect,
  chakra,
  useColorMode,
  type SelectProps,
  type HTMLChakraProps,
} from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Option = forwardRef<HTMLOptionElement, HTMLChakraProps<"option">>(
  (props, ref) => {
    const { colorMode } = useColorMode();
    return (
      <chakra.option
        ref={ref}
        bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
        _hover={{
          bgColor: colorMode === "dark" ? "gray.800" : "gray.100",
        }}
        _active={{
          bgColor: colorMode === "dark" ? "gray.700" : "gray.200",
        }}
        _focus={{
          bgColor: colorMode === "dark" ? "gray.700" : "gray.100",
        }}
        {...props}
      />
    );
  }
);

Option.displayName = "Option";

const BaseSelect = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const { colorMode } = useColorMode();
  const { colorScheme } = useTheme();

  const focusBorderColor =
    colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.400`;

  return (
    <ChakraSelect
      ref={ref}
      bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
      focusBorderColor={focusBorderColor}
      _hover={{ borderColor: focusBorderColor }}
      {...props}
    />
  );
});

BaseSelect.displayName = "Select";

const Select = Object.assign(BaseSelect, { Option });

export default Select;
