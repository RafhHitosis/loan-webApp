import React, { useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return; // ADD this check

    console.log("Notification mounted:", message, type); // ADD this line
    const timer = setTimeout(() => {
      console.log("Auto-closing notification"); // ADD this line
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) return null;

  const config = {
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      iconBg: "bg-red-500/20",
      Icon: AlertTriangle,
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      Icon: Check,
    },
  };

  const { bg, border, text, iconBg, Icon } = config[type] || config.success;

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 ${bg} ${border} backdrop-blur-xl border px-4 py-4 rounded-2xl shadow-lg z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className={`flex-1 text-sm font-medium ${text}`}>{message}</span>
        <button
          onClick={onClose}
          className={`${text} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
