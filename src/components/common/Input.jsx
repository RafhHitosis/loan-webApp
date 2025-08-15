const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
    )}
    <input
      className={`w-full ${
        Icon ? "pl-12" : "pl-4"
      } pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 ${className}`}
      {...props}
    />
  </div>
);

export default Input;
