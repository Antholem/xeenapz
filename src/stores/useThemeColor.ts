"use client";

import { create } from "zustand";

type ColorScheme = "blue" | "gray";

interface ThemeColorState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const useThemeColor = create<ThemeColorState>((set) => ({
  colorScheme: "blue",
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
}));

export default useThemeColor;
