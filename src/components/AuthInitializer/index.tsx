"use client";

import { ReactNode, useEffect } from "react";
import { Progress } from "@themed-components";
import { useAuth } from "@/stores";

const AuthInitializer = ({ children }: { children: ReactNode }) => {
  const { loading, initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth(); // No unsubscribe needed with Supabase
  }, [initializeAuth]);

  return loading ? <Progress size="xs" isIndeterminate /> : children;
};

export default AuthInitializer;
