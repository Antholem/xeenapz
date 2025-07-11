"use client";

import { FC } from "react";
import {
  Spinner as ChakraSpinner,
  SpinnerProps,
  useColorMode,
} from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Spinner: FC<SpinnerProps> = (props) => {
  const { colorScheme } = useTheme();
  const { colorMode } = useColorMode();

  const color =
    colorMode === "dark" ? `${colorScheme}.300` : `${colorScheme}.400`;

  return <ChakraSpinner color={color} {...props} />;
};

export default Spinner;
