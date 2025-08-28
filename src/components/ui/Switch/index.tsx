"use client";

import { forwardRef } from "react";
import { Switch as ChakraSwitch, SwitchProps } from "@chakra-ui/react";
import { useAccentColor } from "@/stores";

const Switch = forwardRef<HTMLInputElement, SwitchProps>((props, ref) => {
  const { accentColor } = useAccentColor();
  return <ChakraSwitch ref={ref} colorScheme={accentColor} {...props} />;
});

Switch.displayName = "Switch";

export default Switch;
