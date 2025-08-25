/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { ref, get, onValue, set } from "firebase/database";
import { auth, database } from "./../lib/firebase";

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
  const [authError, setAuthError] = useState(null);

  // Function to ensure user status exists in database
  const ensureUserStatusExists = async (firebaseUser) => {
    if (!firebaseUser) return;

    try {
      const userStatusRef = ref(database, `userStatus/${firebaseUser.uid}`);
      const snapshot = await get(userStatusRef);

      if (!snapshot.exists()) {
        // Create initial user status
        await set(userStatusRef, {
          email: firebaseUser.email,
          disabled: false,
          createdAt: new Date().toISOString(),
          uid: firebaseUser.uid,
        });
      }
    } catch (error) {
      console.error("Error ensuring user status exists:", error);
    }
  };

  // Function to check if account is disabled using multiple methods
  const checkAccountStatus = async (firebaseUser) => {
    if (!firebaseUser) return false;

    try {
      // Method 1: Check custom claims for disabled status
      const tokenResult = await getIdTokenResult(firebaseUser);
      if (tokenResult.claims.disabled === true) {
        return true;
      }

      // Method 2: Check database for disabled status
      const userStatusRef = ref(database, `userStatus/${firebaseUser.uid}`);
      const snapshot = await get(userStatusRef);
      if (snapshot.exists()) {
        const statusData = snapshot.val();
        if (statusData.disabled === true) {
          return true;
        }
      }

      // If we get here, account is enabled
      return false;
    } catch (error) {
      // For errors, assume account is not disabled to allow access
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);

      if (firebaseUser) {
        try {
          // Ensure user status exists in database
          await ensureUserStatusExists(firebaseUser);

          // Check if account is disabled
          const disabled = await checkAccountStatus(firebaseUser);
          setIsAccountDisabled(disabled);
          setUser(firebaseUser);

          // Set up real-time listener for account status changes
          const userStatusRef = ref(database, `userStatus/${firebaseUser.uid}`);
          const statusUnsubscribe = onValue(userStatusRef, (snapshot) => {
            if (snapshot.exists()) {
              const statusData = snapshot.val();
              setIsAccountDisabled(statusData.disabled === true);
            }
          });

          // Store the unsubscribe function for cleanup
          firebaseUser.statusUnsubscribe = statusUnsubscribe;
        } catch (error) {
          console.error("Error during auth state change:", error);
          setAuthError(error);
          setUser(firebaseUser);
        }
      } else {
        setIsAccountDisabled(false);
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Cleanup status listener when user changes
  useEffect(() => {
    return () => {
      if (user?.statusUnsubscribe) {
        user.statusUnsubscribe();
      }
    };
  }, [user]);

  const signIn = async (email, password) => {
    try {
      setAuthError(null);

      // Regular sign in - let Firebase auth/user-disabled errors surface naturally
      const result = await signInWithEmailAndPassword(auth, email, password);

      // After successful sign in, check our custom disabled status
      const disabled = await checkAccountStatus(result.user);
      setIsAccountDisabled(disabled);

      return result;
    } catch (error) {
      console.error("Sign in error:", error);

      // Handle Firebase's built-in user-disabled error
      if (error.code === "auth/user-disabled") {
        setAuthError(error);
        throw new Error(
          "Your account has been disabled at the system level. Please contact support immediately."
        );
      }

      setAuthError(error);
      throw error;
    }
  };

  const signUp = async (email, password) => {
    try {
      setAuthError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Initialize user status in database as enabled
      const userStatusRef = ref(database, `userStatus/${result.user.uid}`);
      await set(userStatusRef, {
        disabled: false,
        createdAt: new Date().toISOString(),
        email: email,
      });

      return result;
    } catch (error) {
      setAuthError(error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      // Cleanup status listener
      if (user?.statusUnsubscribe) {
        user.statusUnsubscribe();
      }

      setIsAccountDisabled(false);
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      setAuthError(error);
      throw error;
    }
  };

  const clearDisabledStatus = () => {
    setIsAccountDisabled(false);
    setAuthError(null);
  };

  // Function to refresh account status manually
  const refreshAccountStatus = async () => {
    if (user) {
      try {
        const disabled = await checkAccountStatus(user);
        setIsAccountDisabled(disabled);
        return !disabled; // Return true if account is enabled
      } catch (error) {
        console.error("Error refreshing account status:", error);
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    loading,
    isAccountDisabled,
    authError,
    signIn,
    signUp,
    signOut: handleSignOut,
    clearDisabledStatus,
    refreshAccountStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
