"use client";

import { ReactNode, useEffect } from "react";
import { Progress } from "@themed-components";
import { useAuth } from "@/stores";

const AuthInitializer = ({ children }: { children: ReactNode }) => {
  const { loading, initializeAuth } = useAuth();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return loading ? <Progress size="xs" isIndeterminate /> : children;
};

export default AuthInitializer;
