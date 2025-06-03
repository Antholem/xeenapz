import { create } from "zustand";

interface TemporaryChatState {
  isMessageTemporary: boolean;
  setIsMessageTemporary: (isTemporary: boolean) => void;
}

const useTemporaryChat = create<TemporaryChatState>((set) => ({
  isMessageTemporary: false,
  setIsMessageTemporary: (isTemporary: boolean) =>
    set({ isMessageTemporary: isTemporary }),
}));

export default useTemporaryChat;
