import React from "react";
import { Home, List } from "lucide-react";
import NavigationButton from "./NavigationButton";

const BottomNavigation = ({ currentView, onViewChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 z-40 transition-all duration-300">
    {/* Subtle top glow line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

    <div className="grid grid-cols-2 gap-1 p-2">
      <NavigationButton
        view="dashboard"
        icon={Home}
        label="Dashboard"
        isActive={currentView === "dashboard"}
        onViewChange={onViewChange}
      />
      <NavigationButton
        view="loans"
        icon={List}
        label="All Loans"
        isActive={currentView === "loans"}
        onViewChange={onViewChange}
      />
    </div>

    {/* Animated sliding indicator */}
    <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-transform duration-500 ease-out ${
          currentView === "dashboard"
            ? "transform translate-x-0 w-1/2"
            : "transform translate-x-full w-1/2"
        }`}
      ></div>
    </div>
  </nav>
);

export default BottomNavigation;
