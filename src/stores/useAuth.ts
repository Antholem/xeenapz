import { create } from "zustand";
import { auth, onAuthStateChanged, User } from "@/lib/firebase";

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      set({ user: firebaseUser, loading: false });
    });

    return unsubscribe;
  },
}));

export default useAuth;
