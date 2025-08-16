/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./../lib/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.disabled) {
        setIsAccountDisabled(true);
        setUser(null); // Don't set user if account is disabled
      } else {
        setIsAccountDisabled(false);
        setUser(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if account is disabled after successful authentication
      if (result.user && result.user.disabled) {
        setIsAccountDisabled(true);
        await signOut(auth); // Sign out immediately if disabled
        throw new Error("auth/user-disabled");
      }

      return result;
    } catch (error) {
      // Handle disabled account error
      if (error.code === "auth/user-disabled") {
        setIsAccountDisabled(true);
      }
      throw error;
    }
  };

  const signUp = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const handleSignOut = async () => {
    setIsAccountDisabled(false); // Reset disabled state on sign out
    return await signOut(auth);
  };

  const clearDisabledStatus = () => {
    setIsAccountDisabled(false);
  };

  const value = {
    user,
    loading,
    isAccountDisabled,
    signIn,
    signUp,
    signOut: handleSignOut,
    clearDisabledStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
