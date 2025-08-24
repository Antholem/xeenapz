"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  clearThread: (threadId: string) => void;
}

const MAX_MESSAGES_PER_THREAD = 200;

const enforceLimit = (messages: Message[]): Message[] =>
  messages.length > MAX_MESSAGES_PER_THREAD
    ? messages.slice(messages.length - MAX_MESSAGES_PER_THREAD)
    : messages;

const useThreadMessages = create<ThreadMessageStore>()(
  persist(
    (set) => ({
      messagesByThread: {},

      setMessages: (threadId, messages) =>
        set((state) => ({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: enforceLimit(messages),
          },
        })),

      addMessagesToTop: (threadId, newMessages) =>
        set((state) => {
          const existing = state.messagesByThread[threadId] || [];
          const updated = enforceLimit([...newMessages, ...existing]);
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

          const isDuplicate = message.id
            ? existing.some((msg) => msg.id === message.id)
            : existing.some(
                (msg) =>
                  msg.timestamp === message.timestamp &&
                  msg.sender === message.sender &&
                  msg.text === message.text
              );

          if (isDuplicate) return state;

          return {
            messagesByThread: {
              ...state.messagesByThread,
              [threadId]: enforceLimit([...existing, message]),
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
      clearThread: (threadId) =>
        set((state) => {
          const newMessages = { ...state.messagesByThread };
          delete newMessages[threadId];
          return { messagesByThread: newMessages };
        }),
    }),
    {
      name: "thread-messages",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ messagesByThread: state.messagesByThread }),
    }
  )
);

export default useThreadMessages;
