"use client";

import { FC, useState } from "react";
import { Button, Flex, Icon, useColorMode } from "@chakra-ui/react";
import { useTheme } from "@/stores";
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiSunFill,
  RiMoonFill,
  RiComputerFill,
} from "react-icons/ri";

const Appearance: FC = () => {
  const { setColorMode } = useColorMode();
  const { colorScheme } = useTheme();
  const [mode, setMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("chakra-ui-color-mode") as
          | "light"
          | "dark"
          | "system") || "light"
      );
    }
    return "light";
  });

  const handleColorModeChange = (value: "light" | "dark" | "system") => {
    setMode(value);
    setColorMode(value);
  };

  return (
    <Flex direction="column" gap={3}>
      <Flex direction="column" gap={1}>
        <Flex fontWeight="semibold" fontSize="md">
          Color Mode
        </Flex>
        <Flex fontSize="sm" color="secondaryText">
          Select a preferred color mode, or let the app follow your system’s appearance setting
        </Flex>
      </Flex>

      <Flex gap={2} mt={1} wrap="wrap">
        {([
          {
            label: "Light",
            value: "light",
            icon: RiSunLine,
            selectedIcon: RiSunFill,
          },
          {
            label: "Dark",
            value: "dark",
            icon: RiMoonLine,
            selectedIcon: RiMoonFill,
          },
          {
            label: "System",
            value: "system",
            icon: RiComputerLine,
            selectedIcon: RiComputerFill,
          },
        ] as const).map((item) => {
          const isSelected = mode === item.value;
          return (
            <Button
              key={item.value}
              onClick={() => handleColorModeChange(item.value)}
              variant="outline"
              colorScheme={isSelected ? colorScheme : "gray"}
              borderColor={isSelected ? `${colorScheme}.500` : "gray.300"}
              bg={isSelected ? `${colorScheme}.50` : "transparent"}
              _dark={{
                borderColor: isSelected ? `${colorScheme}.300` : "gray.600",
                bg: isSelected ? `${colorScheme}.900` : "transparent",
              }}
              leftIcon={
                <Icon
                  as={isSelected ? item.selectedIcon : item.icon}
                  boxSize={4}
                />
              }
            >
              {item.label}
            </Button>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Appearance;

