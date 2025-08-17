"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AccentColor } from "@/theme/types";

interface AccentColorState {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const useAccentColor = create<AccentColorState>()(
  persist(
    (set) => ({
      accentColor: "blue",
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAccentColor;
