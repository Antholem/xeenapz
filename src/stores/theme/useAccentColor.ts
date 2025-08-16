"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AccentColor } from "@/theme/types";

interface AccentColorState {
  accentColor: AccentColor;
  setAccentColor: (scheme: AccentColor) => void;
}

const useAccentColor = create<AccentColorState>()(
  persist(
    (set) => ({
      accentColor: "blue",
      setAccentColor: (scheme) => set({ accentColor: scheme }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAccentColor;
