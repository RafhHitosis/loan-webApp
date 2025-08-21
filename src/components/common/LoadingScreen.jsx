import React from "react";
import { useTheme } from "./../../contexts/ThemeContext"; // Update the import path

const LoadingScreen = () => {
  const { colors, isInitialized } = useTheme();

  // Don't render until theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <div
      className={`min-h-screen ${colors.background.primary} flex items-center justify-center`}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span
            className={`w-8 h-8 text-white text-4xl font-bold flex items-center justify-center`}
          >
            ₱
          </span>
        </div>
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
