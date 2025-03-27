"use client";

import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState, createContext, useContext } from "react";
import { Progress } from "@chakra-ui/react";
import { app } from "@/lib/firebase"; // Import Firebase instance

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app); // Ensure auth is initialized correctly

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? <Progress size="xs" isIndeterminate /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
