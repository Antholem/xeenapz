"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, []);

  if (!mounted) return null;

  return <ChakraProvider>{children}</ChakraProvider>;
};
