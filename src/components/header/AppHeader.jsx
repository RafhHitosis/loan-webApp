import React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../common/ThemeToggle";

const AppHeader = ({ user, onLogout }) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <header
      className={`${colors.background.secondary} backdrop-blur-xl border-b ${colors.border.primary} sticky top-0 z-40`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="w-6 h-6 text-white text-2xl font-bold flex items-center justify-center">
                ₱
              </span>
            </div>
            <div>
              <h1 className={`text-lg font-bold ${colors.text.primary}`}>
                Loan Tracker
              </h1>
              <p
                className={`text-xs ${colors.text.tertiary} truncate max-w-32`}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className={`
                relative inline-flex h-10 w-10 items-center justify-center 
                rounded-xl transition-all duration-300 ease-in-out
                ${
                  isDarkMode
                    ? "bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-red-400"
                    : "bg-white hover:bg-gray-300 text-gray-700 hover:text-red-500"
                }
                border ${colors.border.primary}
                shadow-sm hover:shadow-md
              `}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
