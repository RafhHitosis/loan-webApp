import React, { useState, useMemo } from "react";
import { Calendar, ChevronDown, ChevronUp, Check, Clock } from "lucide-react";
import { updateBreakdownPayments } from "../../utils/loanCalculations";

const MonthlyBreakdown = ({ loan }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updatedBreakdown = useMemo(() => {
    if (!loan.monthlyBreakdown) return null;
    return updateBreakdownPayments(loan.monthlyBreakdown, loan.payments);
  }, [loan.monthlyBreakdown, loan.payments]);

  if (!updatedBreakdown) return null;

  const paidMonths = updatedBreakdown.filter((m) => m.isPaid).length;
  const totalMonths = updatedBreakdown.length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-700/20 hover:bg-slate-700/30 rounded-lg transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-300" />
          <span className="text-slate-200 font-medium text-sm">
            {loan.interestRate === 0
              ? `Payment Plan - Interest Free (${paidMonths}/${totalMonths} paid)`
              : `Monthly Payment Plan (${paidMonths}/${totalMonths} paid)`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {updatedBreakdown.map((month) => (
            <div
              key={month.month}
              className={`p-3 rounded-lg border ${
                month.isPaid
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : month.paidAmount > 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-slate-700/20 border-slate-600/30"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">
                    Month {month.month}
                  </span>
                  {month.isPaid ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : month.paidAmount > 0 ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : null}
                </div>
                <span className="text-slate-400 text-xs">
                  Due: {new Date(month.dueDate).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Principal: </span>
                  <span className="text-white">
                    ₱{month.principalAmount.toLocaleString()}
                  </span>
                </div>
                {month.interestAmount > 0 && (
                  <div>
                    <span className="text-slate-400">Interest: </span>
                    <span className="text-white">
                      ₱{month.interestAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className={month.interestAmount === 0 ? "col-span-2" : ""}>
                  <span className="text-slate-400">
                    {month.interestAmount === 0
                      ? "Amount Due: "
                      : "Total Due: "}
                  </span>
                  <span className="text-white font-semibold">
                    ₱{month.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Paid: </span>
                  <span
                    className={`font-semibold ${
                      month.isPaid
                        ? "text-emerald-400"
                        : month.paidAmount > 0
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    ₱{month.paidAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {month.isPaid && month.paidDate && (
                <div className="mt-2 text-xs text-emerald-400">
                  Paid on: {new Date(month.paidDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyBreakdown;
