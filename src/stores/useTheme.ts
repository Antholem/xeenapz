"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ColorScheme } from "@/theme/types";

interface ThemeColorState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const useTheme = create<ThemeColorState>()(
  persist(
    (set) => ({
      colorScheme: "telegram",
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTheme;
