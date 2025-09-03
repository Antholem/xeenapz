// stores/auth/useAuth.ts
import { create } from "zustand";
import { supabase } from "@/lib";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => () => void;
}

const ensureUserRecords = async (userId: string) => {
  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (userError) {
    console.error("Error checking user record:", userError);
  } else if (!existingUser) {
    const { error: insertUserError } = await supabase
      .from("users")
      .insert({ id: userId, user_id: userId });
    if (insertUserError)
      console.error("Error creating user record:", insertUserError);
  }

  const { data: pref, error: prefError } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefError) {
    console.error("Error checking user preferences record:", prefError);
  } else if (!pref) {
    const { error: insertPrefError } = await supabase
      .from("user_preferences")
      .insert({ user_id: userId });
    if (insertPrefError)
      console.error(
        "Error creating user preferences record:",
        insertPrefError
      );
  }
};

const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initializeAuth: () => {
    const fetchUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        set({ user: null, loading: false });
        return;
      }

      set({ user: session?.user ?? null, loading: false });
      if (session?.user) await ensureUserRecords(session.user.id);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, loading: false });
      if (session?.user) await ensureUserRecords(session.user.id);
    });

    return () => subscription.unsubscribe();
  },
}));

export default useAuth;
