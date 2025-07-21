import { supabase } from "./config";
import type { Session, User } from "@supabase/supabase-js";

export const auth = supabase.auth;

export const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({ provider: "google" });
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const onAuthStateChanged = (
  callback: (user: User | null) => void
) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
};

export type { User };
