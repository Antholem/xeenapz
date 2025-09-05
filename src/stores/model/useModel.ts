"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { GEMINI_MODEL } from "@/lib";

interface ModelState {
  model: string;
  setModel: (model: string) => void;
  reset: () => void;
}

const useModel = create<ModelState>()(
  persist(
    (set) => ({
      model: GEMINI_MODEL,
      setModel: (model) => set({ model }),
      reset: () => set({ model: GEMINI_MODEL }),
    }),
    {
      name: "model",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useModel;

