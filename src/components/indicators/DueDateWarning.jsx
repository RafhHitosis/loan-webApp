import React, { useState, useMemo } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext"; // Update the import path

const DueDateWarning = ({ loans, onLoanClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colors } = useTheme();

  const dueDateAnalysis = useMemo(() => {
    if (!loans || loans.length === 0)
      return { urgent: [], warning: [], count: 0 };

    const now = new Date();
    const urgent = [];
    const warning = [];

    loans.forEach((loan) => {
      if (loan.status !== "active" || !loan.dueDate || loan.status === "paid")
        return;

      const remainingAmount =
        parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
      if (remainingAmount === 0) return;

      const dueDate = new Date(loan.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // FIXED: Include "due today" (0 days) in urgent list
      if (diffDays <= 0) {
        urgent.push({
          ...loan,
          daysOverdue: Math.abs(diffDays),
          loanId: loan.id, // Ensure loan ID is preserved
        });
      } else if (diffDays <= 3) {
        warning.push({
          ...loan,
          daysLeft: diffDays,
          loanId: loan.id, // Ensure loan ID is preserved
        });
      }
    });

    return {
      urgent: urgent.sort((a, b) => b.daysOverdue - a.daysOverdue),
      warning: warning.sort((a, b) => a.daysLeft - b.daysLeft),
      count: urgent.length + warning.length,
    };
  }, [loans]);

  if (dueDateAnalysis.count === 0) return null;

  const handleLoanItemClick = (loan) => {
    console.log("Due date warning clicked for loan:", loan.id || loan.loanId);
    if (onLoanClick) {
      const loanId =
        loan.id || loan.loanId || `loan-${loan.personName}-${Date.now()}`;
      console.log("Calling onLoanClick with ID:", loanId); // Add debug log
      onLoanClick(loanId);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-3 rounded-xl border transition-all duration-200 ${
          dueDateAnalysis.urgent.length > 0
            ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15 animate-pulse"
            : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dueDateAnalysis.urgent.length > 0
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p
                className={`font-semibold text-sm ${
                  dueDateAnalysis.urgent.length > 0
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {dueDateAnalysis.urgent.length > 0 ? "Urgent!" : "Due Soon"}
              </p>
              <p className={`${colors.text.secondary} text-xs`}>
                {dueDateAnalysis.count} loan
                {dueDateAnalysis.count !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dueDateAnalysis.urgent.length > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium border border-red-500/30">
                {dueDateAnalysis.urgent.length} overdue
              </span>
            )}
            {dueDateAnalysis.warning.length > 0 && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium border border-amber-500/30">
                {dueDateAnalysis.warning.length} soon
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className={`w-4 h-4 ${colors.text.tertiary}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${colors.text.tertiary}`} />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {dueDateAnalysis.urgent.map((loan, index) => (
            <button
              key={loan.id || `urgent-${index}`}
              onClick={() => handleLoanItemClick(loan)}
              className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-red-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 font-bold text-xs">
                      {loan.personName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className={`${colors.text.primary} font-medium text-sm truncate`}
                    >
                      {loan.personName}
                    </p>
                    <p className="text-red-400 text-xs">
                      {/* FIXED: Show "Due today" for 0 days overdue */}
                      {loan.daysOverdue === 0
                        ? "Due today"
                        : `${loan.daysOverdue} day${
                            loan.daysOverdue !== 1 ? "s" : ""
                          } overdue`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`${colors.text.primary} font-semibold text-sm`}>
                    ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                  </p>
                  <span className="text-red-400 text-xs px-2 py-0.5 bg-red-500/20 rounded-full">
                    {loan.type}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {dueDateAnalysis.warning.map((loan, index) => (
            <button
              key={loan.id || `warning-${index}`}
              onClick={() => handleLoanItemClick(loan)}
              className="w-full p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold text-xs">
                      {loan.personName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className={`${colors.text.primary} font-medium text-sm truncate`}
                    >
                      {loan.personName}
                    </p>
                    <p className="text-amber-400 text-xs">
                      Due in {loan.daysLeft} day{loan.daysLeft !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`${colors.text.primary} font-semibold text-sm`}>
                    ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                  </p>
                  <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-500/20 rounded-full">
                    {loan.type}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DueDateWarning;
