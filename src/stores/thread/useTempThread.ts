import { create } from "zustand";

interface TemporaryThreadState {
  isMessageTemporary: boolean;
  setIsMessageTemporary: (isTemporary: boolean) => void;
}

const useTempThread = create<TemporaryThreadState>((set) => ({
  isMessageTemporary: false,
  setIsMessageTemporary: (isTemporary) =>
    set({ isMessageTemporary: isTemporary }),
}));

export default useTempThread;
