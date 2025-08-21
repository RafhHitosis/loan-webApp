import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg",
    secondary: isDarkMode
      ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/40"
      : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg",
    ghost: isDarkMode
      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    outline: isDarkMode
      ? "border-2 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 hover:text-white"
      : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900",
    success: isDarkMode
      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:text-emerald-300"
      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800",
    warning: isDarkMode
      ? "bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 hover:text-amber-300"
      : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:text-amber-800",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4",
    xl: "px-8 py-5 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
