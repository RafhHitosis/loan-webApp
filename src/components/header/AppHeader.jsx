import React from "react";
import { LogOut } from "lucide-react";

const AppHeader = ({ user, onLogout }) => (
  <header className="bg-slate-800/60 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="w-6 h-6 text-white text-2xl font-bold flex items-center justify-center">
              ₱
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Loan Tracker</h1>
            <p className="text-xs text-slate-400 truncate max-w-32">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 flex items-center justify-center"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

export default AppHeader;
