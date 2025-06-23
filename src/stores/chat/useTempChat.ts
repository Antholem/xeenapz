import { create } from "zustand";

interface TemporaryChatState {
  isMessageTemporary: boolean;
  setIsMessageTemporary: (isTemporary: boolean) => void;
}

const useTempChat = create<TemporaryChatState>((set) => ({
  isMessageTemporary: false,
  setIsMessageTemporary: (isTemporary) =>
    set({ isMessageTemporary: isTemporary }),
}));

export default useTempChat;
