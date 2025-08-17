import { COLOR_PALETTES } from "@/theme/color-tokens";

const formatName = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const ACCENT_COLORS = Object.fromEntries(
  Object.entries(COLOR_PALETTES).map(([key, color_palettes]) => [
    key,
    {
      name: formatName(key),
      color_palettes,
    },
  ])
) as {
  [K in keyof typeof COLOR_PALETTES]: {
    name: string;
    color_palettes: (typeof COLOR_PALETTES)[K];
  };
};

export type AccentColors = keyof typeof ACCENT_COLORS;
