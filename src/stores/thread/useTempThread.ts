import { create } from "zustand";

interface TemporaryThreadState {
  isMessageTemporary: boolean;
  setIsMessageTemporary: (isTemporary: boolean) => void;
  reset: () => void;
}

const useTempThread = create<TemporaryThreadState>((set) => ({
  isMessageTemporary: false,
  setIsMessageTemporary: (isTemporary) =>
    set({ isMessageTemporary: isTemporary }),
  reset: () => set({ isMessageTemporary: false }),
}));

export default useTempThread;
