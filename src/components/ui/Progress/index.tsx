"use client";

import { FC } from "react";
import { Progress as ChakraProgress, ProgressProps } from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const Progress: FC<ProgressProps> = (props) => {
  const { colorScheme } = useAccentColor();

  return <ChakraProgress colorScheme={colorScheme} {...props} />;
};

export default Progress;
