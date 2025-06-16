"use client";

import { create } from "zustand";

export interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: number;
  createdAt?: string;
}

interface MessageStore {
  messagesByConversation: {
    [conversationId: string]: Message[];
  };
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessagesToTop: (conversationId: string, messages: Message[]) => void;
  clearMessages: (conversationId: string) => void;
}

const useMessagePersistent = create<MessageStore>((set) => ({
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
      const merged = [
        ...newMessages.filter(
          (m) => !existing.some((e) => e.timestamp === m.timestamp)
        ),
        ...existing,
      ];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: merged,
        },
      };
    }),
  clearMessages: (conversationId) =>
    set((state) => {
      const newState = { ...state.messagesByConversation };
      delete newState[conversationId];
      return { messagesByConversation: newState };
    }),
}));

export default useMessagePersistent;
