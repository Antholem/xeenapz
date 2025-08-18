"use client";

import { FC, useEffect, useState } from "react";
import {
  Button,
  Divider,
  Flex,
  Icon,
  SimpleGrid,
  useColorMode,
} from "@chakra-ui/react";
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
} from "react-icons/ri";
import { FaSquare } from "react-icons/fa6";

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
        .select("color_mode, accent_color")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load user preferences:", error);
        return;
      }

      if (data?.color_mode) {
        const savedMode = data.color_mode as "light" | "dark" | "system";
        setMode(savedMode);
        setColorMode(savedMode);
      } else {
        await supabase
          .from("user_preferences")
          .upsert(
            { user_id: user.id, color_mode: mode },
            { onConflict: "user_id" }
          );
      }

      if (data?.accent_color) {
        setAccentColor(data.accent_color as AccentColors);
      } else {
        await supabase
          .from("user_preferences")
          .upsert(
            { user_id: user.id, accent_color: accentColor },
            { onConflict: "user_id" }
          );
      }
    })();
  }, [user, mode, setColorMode, accentColor, setAccentColor]);

  const handleColorModeChange = async (value: "light" | "dark" | "system") => {
    setMode(value);
    setColorMode(value);

    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, color_mode: value },
        { onConflict: "user_id" }
      );
    if (error) console.error("Failed to save color mode:", error);
  };

  const handleAccentColorChange = async (value: AccentColors) => {
    setAccentColor(value);

    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, accent_color: value },
        { onConflict: "user_id" }
      );
    if (error) console.error("Failed to save accent color:", error);
  };

  return (
    <Flex direction="column" gap={3}>
      <Flex direction="column" gap={1}>
        <Flex fontWeight="semibold" fontSize="md">
          Color Mode
        </Flex>
        <Flex fontSize="sm" color="secondaryText">
          Select a preferred color mode, or let the app follow your system’s
          appearance setting
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 2, sm: 3 }} gap={2}>
        {(
          [
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
          ] as const
        ).map((item) => {
          const isSelected = mode === item.value;
          return (
            <Button
              key={item.value}
              onClick={() => handleColorModeChange(item.value)}
              variant="outline"
              justifyContent="flex-start"
              alignItems="center"
              textAlign="left"
              flex={1}
              colorScheme={isSelected ? accentColor : "gray"}
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
      </SimpleGrid>

      <Divider orientation="horizontal" my={5} />

      <Flex direction="column" gap={1}>
        <Flex fontWeight="semibold" fontSize="md">
          Accent Color
        </Flex>
        <Flex fontSize="sm" color="secondaryText">
          Choose a highlight color for the interface
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={2}>
        {Object.entries(ACCENT_COLORS).map(([key, { name }]) => {
          const isSelected = accentColor === key;
          return (
            <Button
              key={key}
              onClick={() => handleAccentColorChange(key as AccentColors)}
              variant="outline"
              justifyContent="flex-start"
              alignItems="center"
              textAlign="left"
              flex={1}
              colorScheme={isSelected ? (key as AccentColors) : "gray"}
              leftIcon={
                <Icon
                  as={FaSquare}
                  boxSize={6}
                  _light={{ color: `${key}.600` }}
                  _dark={{ color: `${key}.200` }}
                />
              }
            >
              {name}
            </Button>
          );
        })}
      </SimpleGrid>
    </Flex>
  );
};

export default Appearance;

