"use client";

import { create } from "zustand";

interface ChatSettingsState {
  showFollowUpSuggestions: boolean;
  toggleFollowUpSuggestions: () => void;
}

const useChatSettings = create<ChatSettingsState>((set) => ({
  showFollowUpSuggestions: true,
  toggleFollowUpSuggestions: () =>
    set((state) => ({
      showFollowUpSuggestions: !state.showFollowUpSuggestions,
    })),
}));

export default useChatSettings;
