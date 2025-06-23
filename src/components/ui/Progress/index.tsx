"use client";

import { Progress as ProgressInput, ProgressProps } from "@chakra-ui/react";
import { useTheme } from "@/stores";

const Progress = (props: ProgressProps) => {
  const { colorScheme } = useTheme();

  return <ProgressInput colorScheme={colorScheme} {...props} />;
};

export default Progress;
