import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initializeAuth: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    set({ user, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        loading: false,
      });
    });
  },
}));

export default useAuth;
