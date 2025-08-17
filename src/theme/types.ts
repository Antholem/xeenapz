import { COLOR_PALETTES } from "@/theme/color-tokens";

export const ACCENT_COLORS = Object.keys(COLOR_PALETTES) as Array<keyof typeof COLOR_PALETTES>;
export type AccentColors = (typeof ACCENT_COLORS)[number];
