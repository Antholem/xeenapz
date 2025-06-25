"use client";

import {
  Spinner as ChakraSpinner,
  SpinnerProps,
  useColorMode,
} from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Spinner = (props: SpinnerProps) => {
  const { colorScheme } = useTheme();
  const { colorMode } = useColorMode();

  const color =
    colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.400`;

  return <ChakraSpinner color={color} {...props} />;
};

export default Spinner;
