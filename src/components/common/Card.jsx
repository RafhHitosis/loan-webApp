import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Card = ({
  children,
  className = "",
  hover = true,
  onClick,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses = `
    ${
      isDarkMode
        ? "bg-slate-800/60 backdrop-blur-sm border border-slate-600/40"
        : "bg-white/80 backdrop-blur-sm border border-gray-200/60"
    }
    rounded-2xl p-4 shadow-sm transition-all duration-200
    ${
      hover
        ? isDarkMode
          ? "hover:bg-slate-800/80 hover:border-slate-600/60 hover:shadow-lg transform hover:scale-[1.01]"
          : "hover:bg-white/90 hover:border-gray-200/80 hover:shadow-md transform hover:scale-[1.01]"
        : ""
    }
    ${onClick ? "cursor-pointer" : ""}
  `;

  return (
    <div className={`${baseClasses} ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;
