"use client";

import { useEffect } from "react";
import { Progress } from "@chakra-ui/react";
import useAuth from "@/stores/useAuth";

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { loading, initializeAuth } = useAuth();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return loading ? <Progress size="xs" isIndeterminate /> : <>{children}</>;
};

export default AuthInitializer;
