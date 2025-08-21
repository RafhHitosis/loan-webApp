// src/components/common/ThemeToggle.js
import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-10 w-10 items-center justify-center 
        rounded-xl transition-all duration-300 ease-in-out
        ${
          isDarkMode
            ? "bg-slate-700/50 hover:bg-slate-600/50 text-amber-400"
            : "bg-white hover:bg-gray-300 text-gray-700"
        }
        border ${colors.border.primary}
        shadow-sm hover:shadow-md
      `}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative flex items-center justify-center">
        {/* Sun icon for light mode */}
        <Sun
          className={`
      absolute w-5 h-5 transition-all duration-300 transform
      ${
        isDarkMode
          ? "opacity-0 rotate-90 scale-0"
          : "opacity-100 rotate-0 scale-100"
      }
    `}
        />
        {/* Moon icon for dark mode */}
        <Moon
          className={`
      absolute w-5 h-5 transition-all duration-300 transform
      ${
        isDarkMode
          ? "opacity-100 rotate-0 scale-100"
          : "opacity-0 -rotate-90 scale-0"
      }
    `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
