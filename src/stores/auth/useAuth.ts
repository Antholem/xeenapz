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
  const { error: userError } = await supabase
    .from("users")
    .upsert({ id: userId, user_id: userId }, { onConflict: "id" });
  if (userError) console.error("Error ensuring user record:", userError);

  const { error: prefError } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (prefError)
    console.error("Error ensuring user preferences record:", prefError);
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

      if (session?.user) {
        await ensureUserRecords(session.user.id);
        set({ user: session.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureUserRecords(session.user.id);
        set({ user: session.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  },
}));

export default useAuth;
