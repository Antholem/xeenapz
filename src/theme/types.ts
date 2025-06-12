import { COLOR_PALETTES } from "@/theme/color-tokens";

export const COLOR_SCHEMES = Object.keys(COLOR_PALETTES) as Array<keyof typeof COLOR_PALETTES>;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];
