import { create } from "zustand";

interface InputStore {
  inputsByThread: Record<string, string>;
  previewsByThread: Record<string, string | null>;
  filesByThread: Record<string, File | null>;
  setInput: (
    threadId: string,
    input: string | ((prev: string) => string)
  ) => void;
  getInput: (threadId: string) => string;
  setPreview: (threadId: string, preview: string | null) => void;
  getPreview: (threadId: string) => string | null;
  setFile: (threadId: string, file: File | null) => void;
  getFile: (threadId: string) => File | null;
  clearInputs: () => void;
}

const useThreadInput = create<InputStore>((set, get) => ({
  inputsByThread: {},
  previewsByThread: {},
  filesByThread: {},
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
  setPreview: (threadId, preview) => {
    set((state) => ({
      previewsByThread: {
        ...state.previewsByThread,
        [threadId]: preview,
      },
    }));
  },
  getPreview: (threadId) => get().previewsByThread[threadId] ?? null,
  setFile: (threadId, file) => {
    set((state) => ({
      filesByThread: {
        ...state.filesByThread,
        [threadId]: file,
      },
    }));
  },
  getFile: (threadId) => get().filesByThread[threadId] ?? null,
  clearInputs: () => set({
    inputsByThread: {},
    previewsByThread: {},
    filesByThread: {},
  }),
}));

export default useThreadInput;
