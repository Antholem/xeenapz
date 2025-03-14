// src/components/GoogleLogin.tsx

"use client";  // Add this directive at the top

import { useEffect, useState } from "react";
import { auth, signInWithPopup, GoogleAuthProvider, signOut } from "../lib/firebase";
import { User } from "firebase/auth"; // Import the User type

const GoogleLogin = () => {
  const [user, setUser] = useState<User | null>(null); // Use User type here

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User Info:", user);
    } catch (error) {
      console.error("Error logging in with Google:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    console.log("User logged out");
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={handleLogout}>Log out</button>
        </div>
      ) : (
        <button onClick={handleGoogleLogin}>Login with Google</button>
      )}
    </div>
  );
};

export default GoogleLogin;
