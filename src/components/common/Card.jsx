const Card = ({ children, className = "", hover = true, ...props }) => (
  <div
    className={`bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-4 ${
      // Changed from p-6 to p-4
      hover
        ? "hover:bg-slate-800/80 transition-all duration-200 transform hover:scale-[1.01]"
        : ""
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
