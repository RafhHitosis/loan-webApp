import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Input = ({
  icon: Icon,
  className = "",
  error = false,
  disabled = false,
  variant = "default",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const getVariantStyles = () => {
    const baseStyles = isDarkMode
      ? "bg-white/5 border border-white/10"
      : "bg-white border border-gray-300";

    const variants = {
      default: isDarkMode
        ? `${baseStyles} text-white placeholder-slate-400 focus:ring-emerald-500/50 focus:border-emerald-500/50`
        : `${baseStyles} text-gray-900 placeholder-gray-400 focus:ring-emerald-500/30 focus:border-emerald-500`,

      filled: isDarkMode
        ? "bg-slate-800/50 border border-slate-600/40 text-white placeholder-slate-400 focus:ring-emerald-500/50 focus:border-emerald-500/50"
        : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-emerald-500/30 focus:border-emerald-500",

      outlined: isDarkMode
        ? "bg-transparent border-2 border-slate-600 text-white placeholder-slate-400 focus:ring-0 focus:border-emerald-500"
        : "bg-transparent border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-0 focus:border-emerald-500",
    };

    return variants[variant] || variants.default;
  };

  const getStateStyles = () => {
    if (error) {
      return isDarkMode
        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
        : "border-red-500 focus:border-red-600 focus:ring-red-500/30";
    }

    if (disabled) {
      return isDarkMode
        ? "opacity-50 cursor-not-allowed bg-slate-800/20"
        : "opacity-50 cursor-not-allowed bg-gray-100";
    }

    return "";
  };

  const getIconColor = () => {
    if (error) return "text-red-400";
    if (disabled) return isDarkMode ? "text-slate-600" : "text-gray-300";
    return isDarkMode ? "text-slate-400" : "text-gray-400";
  };

  return (
    <div className="relative">
      {Icon && (
        <Icon
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${getIconColor()} transition-colors duration-200`}
        />
      )}
      <input
        className={`
          w-full rounded-xl py-4 transition-all duration-200
          ${Icon ? "pl-12" : "pl-4"} pr-4
          ${getVariantStyles()}
          ${getStateStyles()}
          focus:outline-none focus:ring-2
          disabled:cursor-not-allowed
          ${className}
        `}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default Input;
