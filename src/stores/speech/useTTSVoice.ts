"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TTSVoiceState {
  voice: string | null;
  setVoice: (voice: string | null) => void;
  reset: () => void;
}

const useTTSVoice = create<TTSVoiceState>()(
  persist(
    (set) => ({
      voice: null,
      setVoice: (voice) => set({ voice }),
      reset: () => set({ voice: null }),
    }),
    {
      name: "tts-voice",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTTSVoice;
