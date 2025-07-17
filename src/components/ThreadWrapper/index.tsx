"use client";

import { Flex, FlexProps, useColorMode } from "@chakra-ui/react";
import { FC, PropsWithChildren } from "react";

interface ThreadWrapperProps extends FlexProps {
  isActive: boolean;
  isSearchActive: boolean;
}

const ThreadWrapper: FC<PropsWithChildren<ThreadWrapperProps>> = ({
  isActive,
  isSearchActive,
  children,
  ...rest
}) => {
  const { colorMode } = useColorMode();

  const getBg = (state: "base" | "hover" | "active" | "focus") => {
    const isDark = colorMode === "dark";

    const palette = {
      base: isDark ? "gray.800" : "gray.100",
      hover: isDark ? "gray.700" : "gray.200",
      active: isDark ? "gray.600" : "gray.300",
      focus: isDark ? "gray.700" : "gray.100",
      nonActiveHover: isDark ? "gray.800" : "gray.100",
      nonActiveActive: isDark ? "gray.700" : "gray.200",
    };

    if (!isActive || isSearchActive) {
      if (state === "base") return "transparent";
      if (state === "hover") return palette.nonActiveHover;
      if (state === "active") return palette.nonActiveActive;
      if (state === "focus") return palette.focus;
    }

    return palette[state];
  };

  return (
    <Flex
      role="group"
      direction="row"
      align="center"
      borderRadius="md"
      my={0.7}
      pr={2}
      transition="background 0.15s ease"
      bgColor={getBg("base")}
      cursor="pointer"
      _hover={{ bgColor: getBg("hover") }}
      _active={{ bgColor: getBg("active") }}
      _focus={{ bgColor: getBg("focus") }}
      {...rest}
    >
      {children}
    </Flex>
  );
};

export default ThreadWrapper;
