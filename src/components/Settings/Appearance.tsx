"use client";

import { FC, useEffect, useState } from "react";
import { Button, Flex, Icon, useColorMode } from "@chakra-ui/react";
import { useAccentColor, useAuth } from "@/stores";
import { ACCENT_COLORS, AccentColors } from "@/theme/types";
import { supabase } from "@/lib";
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiSunFill,
  RiMoonFill,
  RiComputerFill,
  RiCheckboxBlankCircleFill,
} from "react-icons/ri";

const Appearance: FC = () => {
  const { setColorMode } = useColorMode();
  const { accentColor, setAccentColor } = useAccentColor();
  const { user } = useAuth();

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("color_mode")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load user color mode:", error);
        return;
      }

      if (data?.color_mode) {
        const saved = data.color_mode as "light" | "dark" | "system";
        setMode(saved);
        setColorMode(saved);
      } else {
        await supabase.from("user_preferences").upsert(
          { user_id: user.id, color_mode: mode },
          { onConflict: "user_id" }
        );
      }
    })();
  }, [user]);

  const handleColorModeChange = async (value: "light" | "dark" | "system") => {
    setMode(value);
    setColorMode(value);

    if (!user) return;
    const { error } = await supabase.from("user_preferences").upsert(
      { user_id: user.id, color_mode: value },
      { onConflict: "user_id" }
    );
    if (error) console.error("Failed to save color mode:", error);
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
              flex={1}
              colorScheme={isSelected ? accentColor : "gray"}
              borderColor={isSelected ? `${accentColor}.500` : "gray.300"}
              bg={isSelected ? `${accentColor}.50` : "transparent"}
              _dark={{
                borderColor: isSelected ? `${accentColor}.300` : "gray.600",
                bg: isSelected ? `${accentColor}.900` : "transparent",
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

      <Flex direction="column" gap={1} mt={4}>
        <Flex fontWeight="semibold" fontSize="md">
          Accent Color
        </Flex>
        <Flex fontSize="sm" color="secondaryText">
          Choose a highlight color for the interface
        </Flex>
      </Flex>

      <Flex gap={2} mt={1} wrap="wrap">
        {Object.entries(ACCENT_COLORS).map(([key, { name }]) => {
          const isSelected = accentColor === key;
          return (
            <Button
              key={key}
              onClick={() => setAccentColor(key as AccentColors)}
              variant="outline"
              flex={1}
              colorScheme={isSelected ? (key as AccentColors) : "gray"}
              borderColor={isSelected ? `${key}.500` : "gray.300"}
              bg={isSelected ? `${key}.50` : "transparent"}
              _dark={{
                borderColor: isSelected ? `${key}.300` : "gray.600",
                bg: isSelected ? `${key}.900` : "transparent",
              }}
              leftIcon={
                <Icon
                  as={RiCheckboxBlankCircleFill}
                  boxSize={4}
                  color={`${key}.500`}
                />
              }
            >
              {name}
            </Button>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Appearance;
