"use client";

import { FC } from "react";
import {
  Spinner as ChakraSpinner,
  SpinnerProps,
  useColorMode,
} from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const Spinner: FC<SpinnerProps> = (props) => {
  const { accentColor } = useAccentColor();
  const { colorMode } = useColorMode();

  const color =
    colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.400`;

  return <ChakraSpinner color={color} {...props} />;
};

export default Spinner;
