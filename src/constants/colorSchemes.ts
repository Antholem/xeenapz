import { colorSchemes } from "@/lib/theme";

export const availableColorSchemes = Object.keys(colorSchemes) as Array<keyof typeof colorSchemes>;
export type ColorScheme = (typeof availableColorSchemes)[number];
