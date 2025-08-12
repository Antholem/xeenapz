"use client";

import { forwardRef } from "react";
import {
  ModalContent as ChakraModalContent,
  useColorMode,
  type BoxProps,
} from "@chakra-ui/react";

const ModalContent = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  const { colorMode } = useColorMode();

  return (
    <ChakraModalContent
      ref={ref}
      bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
      {...props}
    />
  );
});

ModalContent.displayName = "ModalContent";

export default ModalContent;
