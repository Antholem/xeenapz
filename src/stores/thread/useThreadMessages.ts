import { create } from "zustand";

export interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

interface ThreadMessageStore {
  messagesByThread: Record<string, Message[]>;
  setMessages: (threadId: string, messages: Message[]) => void;
  addMessagesToTop: (threadId: string, newMessages: Message[]) => void;
  addMessageToBottom: (threadId: string, message: Message) => void;
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
}));

export default useThreadMessages;
