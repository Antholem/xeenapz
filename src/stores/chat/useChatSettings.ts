"use client";

import { create } from "zustand";

interface ChatSettingsState {
  smartSuggestions: boolean;
  setSmartSuggestions: (value: boolean) => void;
  toggleSmartSuggestions: () => void;
}

const useChatSettings = create<ChatSettingsState>((set) => ({
  smartSuggestions: true,
  setSmartSuggestions: (value) => set({ smartSuggestions: value }),
  toggleSmartSuggestions: () =>
    set((state) => ({ smartSuggestions: !state.smartSuggestions })),
}));

export default useChatSettings;
