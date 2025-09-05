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

const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initializeAuth: () => {
    const ensureUserRecords = async (user: User) => {
      try {
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (userError) {
          console.error("Error checking user record:", userError);
        }

        if (!userRow) {
          const { error: insertUserError } = await supabase
            .from("users")
            .insert({ id: user.id, user_id: user.id });
          if (insertUserError)
            console.error("Error creating user record:", insertUserError);
        }

        const { data: prefRow, error: prefError } = await supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefError) {
          console.error("Error checking user preferences:", prefError);
        }

        if (!prefRow) {
          const { error: insertPrefError } = await supabase
            .from("user_preferences")
            .insert({ user_id: user.id });
          if (insertPrefError)
            console.error("Error creating user preferences:", insertPrefError);
        }
      } catch (err) {
        console.error("Failed to ensure user records:", err);
      }
    };

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

      const loggedInUser = session?.user ?? null;
      set({ user: loggedInUser, loading: false });
      if (loggedInUser) await ensureUserRecords(loggedInUser);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;
      set({ user: authUser, loading: false });
      if (authUser) ensureUserRecords(authUser);
    });

    return () => subscription.unsubscribe();
  },
}));

export default useAuth;
