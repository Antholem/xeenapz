"use client";

import { FC, useEffect, useState } from "react";
import { Button, Flex, Icon, useColorMode } from "@chakra-ui/react";
import { useTheme, useAuth } from "@/stores";
import { supabase } from "@/lib";
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
