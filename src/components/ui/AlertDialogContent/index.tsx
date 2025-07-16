"use client";

import { forwardRef } from "react";
import {
  AlertDialogContent as ChakraAlertDialogContent,
  useColorMode,
  type BoxProps,
} from "@chakra-ui/react";

const AlertDialogContent = forwardRef<HTMLDivElement, BoxProps>(
  (props, ref) => {
    const { colorMode } = useColorMode();

    return (
      <ChakraAlertDialogContent
        ref={ref}
        bgColor={colorMode === "light" ? "surface" : "mutedSurface"}
        {...props}
      />
    );
  }
);

AlertDialogContent.displayName = "AlertDialogContent";

export default AlertDialogContent;
