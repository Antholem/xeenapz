import { create } from "zustand";

export interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

interface MessageStoreState {
  messagesByConversation: Record<string, Message[]>;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessagesToTop: (conversationId: string, newMessages: Message[]) => void;
  addMessageToBottom: (conversationId: string, message: Message) => void;
}

const useMessagePersistent = create<MessageStoreState>((set) => ({
  messagesByConversation: {},

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  addMessagesToTop: (conversationId, newMessages) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      const updated = [...newMessages, ...existing];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: updated,
        },
      };
    }),

  addMessageToBottom: (conversationId, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];

      const isDuplicate = existing.some(
        (msg) =>
          msg.timestamp === message.timestamp &&
          msg.sender === message.sender &&
          msg.text === message.text
      );

      if (isDuplicate) return state;

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    }),
}));

export default useMessagePersistent;
