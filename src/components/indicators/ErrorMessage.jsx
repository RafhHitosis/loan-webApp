const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
