import { create } from "zustand";

interface InputStore {
  inputsByConversation: Record<string, string>;
  setInput: (
    conversationId: string,
    input: string | ((prev: string) => string)
  ) => void;
  getInput: (conversationId: string) => string;
  clearInputs: () => void;
}

const useChatInput = create<InputStore>((set, get) => ({
  inputsByConversation: {},
  setInput: (conversationId, input) => {
    set((state) => ({
      inputsByConversation: {
        ...state.inputsByConversation,
        [conversationId]:
          typeof input === "function"
            ? input(state.inputsByConversation[conversationId] ?? "")
            : input,
      },
    }));
  },
  getInput: (conversationId) =>
    get().inputsByConversation[conversationId] ?? "",
  clearInputs: () => set({ inputsByConversation: {} }),
}));

export default useChatInput;
