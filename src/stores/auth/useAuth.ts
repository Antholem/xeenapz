import { create } from "zustand";
import { auth, onAuthStateChanged, type User } from "@/lib";

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
    const unsubscribe = onAuthStateChanged((authUser) => {
      set({ user: authUser, loading: false });
    });

    return unsubscribe;
  },
}));

export default useAuth;
