import { create } from "zustand";

interface InputStore {
  inputsByThread: Record<string, string>;
  setInput: (
    threadId: string,
    input: string | ((prev: string) => string)
  ) => void;
  getInput: (threadId: string) => string;
  clearInputs: () => void;
}

const useThreadInput = create<InputStore>((set, get) => ({
  inputsByThread: {},
  setInput: (threadId, input) => {
    set((state) => ({
      inputsByThread: {
        ...state.inputsByThread,
        [threadId]:
          typeof input === "function"
            ? input(state.inputsByThread[threadId] ?? "")
            : input,
      },
    }));
  },
  getInput: (threadId) => get().inputsByThread[threadId] ?? "",
  clearInputs: () => set({ inputsByThread: {} }),
}));

export default useThreadInput;
