"use client";

import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Icon,
  SimpleGrid,
  Text,
  useColorMode,
  useColorModeValue,
  useToken,
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

const SectionTitle = ({ title, desc }: { title: string; desc: string }) => (
  <Flex direction="column" gap={1} mb={2}>
    <Text fontWeight="semibold" fontSize="md">
      {title}
    </Text>
    <Text fontSize="sm" color="secondaryText">
      {desc}
    </Text>
  </Flex>
);

const ModeButton = ({
  label,
  icon,
  selectedIcon,
  isActive,
  onClick,
  activeColor,
}: {
  label: string;
  icon: any;
  selectedIcon: any;
  isActive: boolean;
  onClick: () => void;
  activeColor: string;
}) => {
  const border = useColorModeValue("gray.300", "gray.600");
  const activeBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Button
      onClick={onClick}
      variant="outline"
      justifyContent="flex-start"
      leftIcon={<Icon as={isActive ? selectedIcon : icon} boxSize={4} />}
      isActive={isActive}
      aria-pressed={isActive}
      color={isActive ? activeColor : "inherit"}
      borderColor={isActive ? activeColor : border}
      bg={isActive ? activeBg : "transparent"}
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      _active={{ bg: activeBg }}
      height="44px"
      flex="1"
    >
      {label}
    </Button>
  );
};

const AccentTile = ({
  name,
  colorKey,
  isActive,
  onClick,
}: {
  name: string;
  colorKey: AccentColors | string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const border = useColorModeValue("gray.300", "gray.600");
  const dotLight = `${colorKey}.600`;
  const dotDark = `${colorKey}.200`;
  const [swatchLight, swatchDark] = useToken("colors", [dotLight, dotDark]);
  const activeRing = useColorModeValue(`${colorKey}.400`, `${colorKey}.300`);
  const activeText = useColorModeValue(`${colorKey}.700`, `${colorKey}.200`);
  const hoveredBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const activeBg = useColorModeValue("gray.100", "whiteAlpha.200");

  return (
    <Flex
      as="button"
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onClick}
      px={3}
      py={2.5}
      gap={3}
      align="center"
      justify="space-between"
      rounded="md"
      borderWidth="1px"
      borderColor={isActive ? activeRing : border}
      bg={isActive ? activeBg : "transparent"}
      _hover={{ bg: hoveredBg }}
      _active={{ bg: activeBg }}
      outline="0"
      transition="all .15s ease"
    >
      <Flex align="center" gap={3} minW={0}>
        <Icon
          as={FaSquare}
          boxSize={5}
          color={useColorModeValue(swatchLight, swatchDark)}
          flexShrink={0}
        />
        <Text noOfLines={1} color={isActive ? activeText : "inherit"}>
          {name}
        </Text>
      </Flex>
    </Flex>
  );
};

const Appearance: FC = () => {
  const { setColorMode } = useColorMode();
  const { accentColor, setAccentColor } = useAccentColor();
  const activeModeText = useColorModeValue( 
    `${accentColor}.600`,
    `${accentColor}.200`
  );

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
        const saved = data.color_mode as "light" | "dark" | "system";
        setMode(saved);
        setColorMode(saved);
      } else {
        await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, color_mode: mode }, { onConflict: "user_id" });
      }

      if (data?.accent_color) {
        setAccentColor(data.accent_color as AccentColors);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveMode = async (value: "light" | "dark" | "system") => {
    setMode(value);
    setColorMode(value);
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, color_mode: value }, { onConflict: "user_id" });
    if (error) console.error("Failed to save color mode:", error);
  };

  const saveAccent = async (value: AccentColors) => {
    setAccentColor(value);
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, accent_color: value }, { onConflict: "user_id" });
    if (error) console.error("Failed to save accent color:", error);
  };

  return (
    <Flex direction="column" gap={6}>
      <Box>
        <SectionTitle
          title="Color Mode"
          desc="Select a preferred color mode, or let the app follow your system’s appearance setting"
        />
        <ButtonGroup isAttached w="full" gap={2}>
          <ModeButton
            label="Light"
            icon={RiSunLine}
            selectedIcon={RiSunFill}
            isActive={mode === "light"}
            onClick={() => saveMode("light")}
            activeColor={activeModeText}
          />
          <ModeButton
            label="Dark"
            icon={RiMoonLine}
            selectedIcon={RiMoonFill}
            isActive={mode === "dark"}
            onClick={() => saveMode("dark")}
            activeColor={activeModeText}
          />
          <ModeButton
            label="System"
            icon={RiComputerLine}
            selectedIcon={RiComputerFill}
            isActive={mode === "system"}
            onClick={() => saveMode("system")}
            activeColor={activeModeText}
          />
        </ButtonGroup>
      </Box>

      <Divider />

      <Box>
        <SectionTitle
          title="Accent Color"
          desc="Choose a highlight color for the interface"
        />
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={2.5} role="radiogroup" aria-label="Accent color">
          {Object.entries(ACCENT_COLORS).map(([key, { name }]) => (
            <AccentTile
              key={key}
              name={name}
              colorKey={key as AccentColors}
              isActive={accentColor === key}
              onClick={() => saveAccent(key as AccentColors)}
            />
          ))}
        </SimpleGrid>
      </Box>
    </Flex>
  );
};

export default Appearance;
