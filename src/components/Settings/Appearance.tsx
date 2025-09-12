"use client";

import { FC, useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Icon,
  Text,
  Grid,
  useColorMode,
} from "@chakra-ui/react";
import { useAccentColor, useAuth } from "@/stores";
import { ACCENT_COLORS, AccentColors } from "@/theme/types";
import { supabase } from "@/lib";
import { Menu } from "@/components/ui";
import { RiSunLine, RiMoonLine, RiComputerLine } from "react-icons/ri";
import { FaSquare, FaCheckSquare } from "react-icons/fa";

const MODE_STORAGE_KEY = "color-mode-preference";

const SettingRow = ({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: ReactNode;
}) => (
  <Grid
    templateColumns={{ base: "1fr", md: "1fr auto" }}
    columnGap={4}
    rowGap={{ base: 3, md: 1 }}
    alignItems={{ base: "start", md: "center" }}
  >
    <Box minW={0}>
      <Text fontWeight="medium">{label}</Text>
      {description && (
        <Text
          mt={1}
          fontSize="xs"
          color="secondaryText"
          wordBreak="break-word"
        >
          {description}
        </Text>
      )}
    </Box>

    <Flex
      justify={{ base: "stretch", md: "flex-end" }}
      minW={{ base: 0, md: "fit-content" }}
      w={{ base: "full", md: "auto" }}
    >
      {control}
    </Flex>
  </Grid>
);

const Appearance: FC = () => {
  const { setColorMode } = useColorMode();
  const { accentColor, setAccentColor } = useAccentColor();

  const { user } = useAuth();

  const [mode, setMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem(MODE_STORAGE_KEY) as
          | "light"
          | "dark"
          | "system") || "system"
      );
    }
    return "system";
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
        const saved = data.color_mode as "light" | "dark" | "system";
        setMode(saved);
        setColorMode(saved);
        if (typeof window !== "undefined") {
          localStorage.setItem(MODE_STORAGE_KEY, saved);
        }
      } else {
        await supabase
          .from("user_preferences")
          .upsert(
            { user_id: user.id, color_mode: mode },
            { onConflict: "user_id" }
          );
        if (typeof window !== "undefined") {
          localStorage.setItem(MODE_STORAGE_KEY, mode);
        }
      }

      if (data?.accent_color) {
        setAccentColor(data.accent_color as AccentColors);
      }
    })();
  }, [user]);

  const saveMode = async (value: "light" | "dark" | "system") => {
    setMode(value);
    setColorMode(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(MODE_STORAGE_KEY, value);
    }
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, color_mode: value },
        { onConflict: "user_id" }
      );
    if (error) console.error("Failed to save color mode:", error);
  };

  const saveAccent = async (value: AccentColors) => {
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

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MODE_STORAGE_KEY && e.newValue) {
        setMode(e.newValue as "light" | "dark" | "system");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Theme & Colors
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <SettingRow
              label="Color Mode"
              description="Select Light, Dark, or follow your system preference."
              control={
                <Menu
                  value={mode}
                  onChange={(value) => {
                    if (!value) return;
                    return saveMode(value as "light" | "dark" | "system");
                  }}
                  items={[
                    {
                      value: "light",
                      label: "Light",
                      icon: <Icon as={RiSunLine} boxSize={4} />,
                    },
                    {
                      value: "dark",
                      label: "Dark",
                      icon: <Icon as={RiMoonLine} boxSize={4} />,
                    },
                    {
                      value: "system",
                      label: "System",
                      icon: <Icon as={RiComputerLine} boxSize={4} />,
                    },
                  ]}
                  includeNullOption={false}
                  buttonProps={{ variant: "outline" }}
                />
              }
            />

            <Divider />
            <SettingRow
              label="Accent Color"
              description="Pick a highlight color for buttons, links, and emphasis."
              control={
                <Menu
                  value={accentColor}
                  onChange={(value) => {
                    if (!value) return;
                    saveAccent(value as AccentColors);
                  }}
                  items={Object.entries(ACCENT_COLORS).map(([key, { name }]) => ({
                    value: key,
                    label: name,
                    icon: (
                      <Icon
                        as={accentColor === key ? FaCheckSquare : FaSquare}
                        boxSize={4}
                        color={`${key}.600`}
                        _dark={{ color: `${key}.200` }}
                      />
                    ),
                  }))}
                  includeNullOption={false}
                  buttonProps={{ variant: "outline" }}
                />
              }
            />
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Appearance;
