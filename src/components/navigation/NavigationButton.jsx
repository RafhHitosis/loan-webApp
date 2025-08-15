import React from "react";

const NavigationButton = ({
  view,
  // eslint-disable-next-line
  icon: Icon,
  label,
  isActive,
  onViewChange,
}) => (
  <button
    onClick={() => onViewChange(view)}
    className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
      isActive
        ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
    }`}
  >
    {/* Animated background glow for active state */}
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-emerald-400/5 rounded-xl animate-pulse"></div>
    )}

    {/* Icon with bounce animation on hover */}
    <div className="relative z-10 transition-transform duration-200 hover:scale-110">
      <Icon
        className={`w-5 h-5 transition-all duration-300 ${
          isActive ? "drop-shadow-lg" : ""
        }`}
      />
    </div>

    {/* Label with slide animation */}
    <span
      className={`relative z-10 text-xs font-medium transition-all duration-300 ${
        isActive ? "tracking-wide" : ""
      }`}
    >
      {label}
    </span>
  </button>
);

export default NavigationButton;
