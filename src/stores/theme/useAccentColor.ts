"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ColorScheme } from "@/theme/types";

interface AccentColorState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const useAccentColor = create<AccentColorState>()(
  persist(
    (set) => ({
      colorScheme: "blue",
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: "accent-color",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAccentColor;
