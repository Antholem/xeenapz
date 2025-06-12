"use client";

import { create } from "zustand";
import { ColorScheme } from "@/constants/colorSchemes";

interface ThemeColorState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const useThemeColor = create<ThemeColorState>((set) => ({
  colorScheme: "blue",
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
}));

export default useThemeColor;
