"use client";

import { ReactNode, useEffect, useState } from "react";
import { Progress } from "@themed-components";
import { supabase } from "@/lib";
import { useAuth } from "@/stores";

const AuthInitializer = ({ children }: { children: ReactNode }) => {
  const { user, loading, initializeAuth } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    const ensureRecords = async () => {
      if (!loading && user) {
        try {
          await supabase
            .from("users")
            .upsert({ id: user.id, user_id: user.id });

          await supabase
            .from("user_preferences")
            .upsert({ user_id: user.id }, { onConflict: "user_id" });
        } catch (error) {
          console.error("Failed to initialize user records:", error);
        }
      }
      if (!loading) {
        setReady(true);
      }
    };

    ensureRecords();
  }, [user, loading]);

  if (loading || !ready) {
    return <Progress size="xs" isIndeterminate />;
  }

  return children;
};

export default AuthInitializer;
