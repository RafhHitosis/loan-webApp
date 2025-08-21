/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper function to get initial theme
const getInitialTheme = () => {
  // Check if we're in browser environment
  if (typeof window === "undefined") return true; // Default to dark for SSR

  try {
    const savedTheme = localStorage.getItem("loantracker-theme");
    console.log("Saved theme from localStorage:", savedTheme); // Debug log

    if (savedTheme !== null) {
      return savedTheme === "dark";
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }

  // Default to dark mode if no saved preference
  return true;
};

export const ThemeProvider = ({ children }) => {
  // Initialize with the saved theme or default to dark
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    console.log("Initial theme on mount:", initialTheme ? "dark" : "light"); // Debug log
    setIsDarkMode(initialTheme);
    setIsInitialized(true);

    // Apply theme class to document root
    document.documentElement.className = initialTheme ? "dark" : "light";
  }, []);

  // Save theme to localStorage when it changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      const themeValue = isDarkMode ? "dark" : "light";
      localStorage.setItem("loantracker-theme", themeValue);
      console.log("Theme saved to localStorage:", themeValue); // Debug log

      // Apply theme class to document root
      document.documentElement.className = themeValue;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [isDarkMode, isInitialized]);

  const toggleTheme = () => {
    console.log("Toggling theme from:", isDarkMode ? "dark" : "light"); // Debug log
    setIsDarkMode((prev) => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    isInitialized, // Export this so components can wait for initialization
    colors: {
      // Background colors
      background: {
        primary: isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100",
        secondary: isDarkMode ? "bg-slate-800/40" : "bg-white/80",
        card: isDarkMode ? "bg-slate-800/50" : "bg-white",
        elevated: isDarkMode ? "bg-slate-700/50" : "bg-gray-50",
      },
      // Text colors
      text: {
        primary: isDarkMode ? "text-white" : "text-gray-900",
        secondary: isDarkMode ? "text-slate-300" : "text-gray-700",
        tertiary: isDarkMode ? "text-slate-400" : "text-gray-500",
        muted: isDarkMode ? "text-slate-500" : "text-gray-400",
      },
      // Border colors
      border: {
        primary: isDarkMode ? "border-slate-600/30" : "border-gray-200",
        secondary: isDarkMode ? "border-slate-700/50" : "border-gray-100",
      },
      // Interactive elements
      interactive: {
        hover: isDarkMode ? "hover:bg-slate-700/50" : "hover:bg-gray-100",
        active: isDarkMode ? "active:bg-slate-600/50" : "active:bg-gray-200",
      },
      // Status colors (remain mostly the same for consistency)
      status: {
        success: "text-emerald-400",
        warning: "text-amber-400",
        error: "text-red-400",
        info: "text-blue-400",
      },
    },
  };

  // Show nothing until theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
