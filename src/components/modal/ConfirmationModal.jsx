import { Trash2, LogOut } from "lucide-react";
import Button from "../common/Button";

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger" or "warning"
}) => {
  if (!open) return null;

  const typeStyles = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      confirmBtn:
        "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    },
    warning: {
      icon: LogOut,
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      confirmBtn:
        "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={false}
            >
              {cancelText}
            </Button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg px-4 py-3 ${style.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
