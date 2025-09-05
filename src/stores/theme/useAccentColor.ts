"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AccentColors } from "@/theme/types";

interface AccentColorState {
  accentColor: AccentColors;
  setAccentColor: (scheme: AccentColors) => void;
  reset: () => void;
}

const useAccentColor = create<AccentColorState>()(
  persist(
    (set) => ({
      accentColor: "cyan",
      setAccentColor: (scheme) => set({ accentColor: scheme }),
      reset: () => set({ accentColor: "cyan" }),
    }),
    {
      name: "accent-color",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAccentColor;
