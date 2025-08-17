"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ColorScheme } from "@/theme/types";

interface AccentColorState {
  accentColor: ColorScheme;
  setAccentColor: (scheme: ColorScheme) => void;
}

const useAccentColor = create<AccentColorState>()(
  persist(
    (set) => ({
      accentColor: "blue",
      setAccentColor: (scheme) => set({ accentColor: scheme }),
    }),
    {
      name: "accent-color",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAccentColor;
