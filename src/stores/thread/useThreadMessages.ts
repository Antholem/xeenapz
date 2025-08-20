import { create } from "zustand";

export interface Message {
  id?: string; // ⬅️ Was: id: any;
  text: string | null;
  sender: "user" | "bot";
  timestamp: number;
  created_at?: string;
  image?: {
    id: string;
    path: string;
    url: string;
  } | null;
}

interface ThreadMessageStore {
  messagesByThread: Record<string, Message[]>;
  setMessages: (threadId: string, messages: Message[]) => void;
  addMessagesToTop: (threadId: string, newMessages: Message[]) => void;
  addMessageToBottom: (threadId: string, message: Message) => void;
  updateMessage: (
    threadId: string,
    messageId: string,
    updatedData: Partial<Message>
  ) => void;
  deleteMessage: (threadId: string, messageId: string) => void;
  clearMessages: () => void;
}

const useThreadMessages = create<ThreadMessageStore>((set) => ({
  messagesByThread: {},

  setMessages: (threadId, messages) =>
    set((state) => ({
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: messages,
      },
    })),

  addMessagesToTop: (threadId, newMessages) =>
    set((state) => {
      const existing = state.messagesByThread[threadId] || [];
      const updated = [...newMessages, ...existing];
      return {
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: updated,
        },
      };
    }),

  addMessageToBottom: (threadId, message) =>
    set((state) => {
      const existing = state.messagesByThread[threadId] || [];

      const isDuplicate = existing.some(
        (msg) =>
          msg.timestamp === message.timestamp &&
          msg.sender === message.sender &&
          msg.text === message.text
      );

      if (isDuplicate) return state;

      return {
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: [...existing, message],
        },
      };
    }),

  updateMessage: (threadId, messageId, updatedData) =>
    set((state) => {
      const existing = state.messagesByThread[threadId] || [];
      const updated = existing.map((msg) =>
        msg.id === messageId ? { ...msg, ...updatedData } : msg
      );

      return {
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: updated,
        },
      };
    }),

  deleteMessage: (threadId, messageId) =>
    set((state) => {
      const existing = state.messagesByThread[threadId] || [];
      const filtered = existing.filter((msg) => msg.id !== messageId);

      return {
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: filtered,
        },
      };
    }),
  clearMessages: () => set({ messagesByThread: {} }),
}));

export default useThreadMessages;
