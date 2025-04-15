"use client";

import { useState, createContext, useContext, ReactNode } from "react";

interface TemporaryChatContextType {
  isMessageTemporary: boolean;
  setIsMessageTemporary: (isTemporary: boolean) => void;
}

const TemporaryChatContext = createContext<
  TemporaryChatContextType | undefined
>(undefined);

const TemporaryChatProvider = ({ children }: { children: ReactNode }) => {
  const [isMessageTemporary, setIsMessageTemporary] = useState<boolean>(false);

  return (
    <TemporaryChatContext.Provider
      value={{ isMessageTemporary, setIsMessageTemporary }}
    >
      {children}
    </TemporaryChatContext.Provider>
  );
};

const useTemporaryChat = () => {
  const context = useContext(TemporaryChatContext);
  if (!context) {
    throw new Error(
      "useTemporaryChat must be used within a TemporaryChatProvider"
    );
  }
  return context;
};

export { TemporaryChatProvider, useTemporaryChat };
