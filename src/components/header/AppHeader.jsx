import React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../common/ThemeToggle";

const AppHeader = ({ user, onLogout }) => {
  const { colors } = useTheme();

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
            <ThemeToggle
              className={`w-10 h-10 rounded-xl ${colors.background.elevated} ${colors.interactive.hover} ${colors.text.secondary} hover:text-emerald-400 transition-all duration-200 flex items-center justify-center`}
            />
            <button
              onClick={onLogout}
              className={`w-10 h-10 rounded-xl ${colors.background.elevated} ${colors.interactive.hover} ${colors.text.secondary} hover:text-red-400 transition-all duration-200 flex items-center justify-center border ${colors.border.primary} shadow-sm`}
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
