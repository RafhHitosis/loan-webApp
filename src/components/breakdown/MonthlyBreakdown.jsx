import React, { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Calculator,
} from "lucide-react";
import {
  updateBreakdownPayments,
  calculateEarlySettlement,
} from "../../utils/loanCalculations";
import { useTheme } from "../../contexts/ThemeContext";

const MonthlyBreakdown = ({ loan }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEarlySettlement, setShowEarlySettlement] = useState(false);
  const { colors } = useTheme();

  const updatedBreakdown = useMemo(() => {
    if (!loan.monthlyBreakdown) return null;
    return updateBreakdownPayments(loan.monthlyBreakdown, loan.payments);
  }, [loan.monthlyBreakdown, loan.payments]);

  // Calculate early settlement if applicable
  const earlySettlement = useMemo(() => {
    if (!updatedBreakdown || loan.interestRate === 0) return null;

    const paidMonths = updatedBreakdown.filter((m) => m.isPaid).length;
    const currentMonth = updatedBreakdown.find(
      (m, index) => index === paidMonths && !m.isPaid
    );

    if (!currentMonth || paidMonths >= updatedBreakdown.length) return null;

    // Estimate days into current month (simplified - could be enhanced with actual payment tracking)
    const today = new Date();
    const currentMonthDue = new Date(currentMonth.dueDate);
    const monthStart = new Date(
      currentMonthDue.getFullYear(),
      currentMonthDue.getMonth(),
      1
    );
    const daysElapsed = Math.max(
      0,
      Math.min(30, Math.ceil((today - monthStart) / (1000 * 60 * 60 * 24)))
    );

    return calculateEarlySettlement(
      loan.amount,
      loan.interestRate,
      updatedBreakdown.length,
      paidMonths,
      daysElapsed
    );
  }, [updatedBreakdown, loan.amount, loan.interestRate]);

  if (!updatedBreakdown) return null;

  const paidMonths = updatedBreakdown.filter((m) => m.isPaid).length;
  const totalMonths = updatedBreakdown.length;
  const isGLoan = loan.interestRate > 0;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 ${colors.background.elevated} ${colors.interactive.hover} rounded-lg transition-colors duration-200 ${colors.border.primary} border`}
      >
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${colors.text.secondary}`} />
          <span className={`${colors.text.primary} font-medium text-sm`}>
            {loan.interestRate === 0
              ? `Payment Plan - Interest Free (${paidMonths}/${totalMonths} paid)`
              : `GLoan Payment Formula (${paidMonths}/${totalMonths} paid)`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${colors.text.tertiary}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${colors.text.tertiary}`} />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* GLoan Formula Info */}
          {isGLoan && (
            <div
              className={`p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">
                  GLoan Formula Applied
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className={colors.text.secondary}>
                  Installment = (₱{loan.amount.toLocaleString()} + ₱
                  {(
                    loan.amount *
                    loan.interestRate *
                    totalMonths
                  ).toLocaleString()}
                  ) ÷ {totalMonths} months
                </div>
                <div className={colors.text.tertiary}>
                  Processing Fee: 3% = ₱{(loan.amount * 0.03).toLocaleString()}{" "}
                  deducted upfront
                </div>
                <div className={colors.text.tertiary}>
                  Net Proceeds: ₱{(loan.amount * 0.97).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Early Settlement Option */}
          {earlySettlement && paidMonths < totalMonths && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <button
                onClick={() => setShowEarlySettlement(!showEarlySettlement)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-medium text-sm">
                    💡 Early Settlement Available
                  </span>
                </div>
                {showEarlySettlement ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              {showEarlySettlement && (
                <div className="mt-2 space-y-2 text-xs animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`${colors.background.elevated} rounded p-2 text-center`}
                    >
                      <div className={colors.text.tertiary}>
                        Remaining Principal
                      </div>
                      <div className={`${colors.text.primary} font-semibold`}>
                        ₱{earlySettlement.remainingPrincipal.toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`${colors.background.elevated} rounded p-2 text-center`}
                    >
                      <div className={colors.text.tertiary}>
                        Prorated Interest
                      </div>
                      <div className="text-amber-400 font-semibold">
                        ₱{earlySettlement.proratedInterest.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 rounded p-2 text-center">
                    <div className="text-emerald-300">
                      Early Settlement Total
                    </div>
                    <div className="text-emerald-400 font-bold">
                      ₱{earlySettlement.totalEarlySettlement.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-500/20 rounded p-2 text-center">
                    <div className="text-blue-300">Interest Saved</div>
                    <div className="text-blue-400 font-semibold">
                      ₱{earlySettlement.savedInterest.toLocaleString()}
                    </div>
                  </div>
                  <div className={`${colors.text.tertiary} text-center`}>
                    Formula: Principal + (Principal × Rate × Days/30)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monthly Payment Breakdown */}
          {updatedBreakdown.map((month) => (
            <div
              key={month.month}
              className={`p-3 rounded-lg border ${
                month.isPaid
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : month.paidAmount > 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : `${colors.background.elevated} ${colors.border.primary}`
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`${colors.text.primary} font-medium text-sm`}
                  >
                    Month {month.month}
                  </span>
                  {month.isPaid ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : month.paidAmount > 0 ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : null}
                  {month.isLastPayment && isGLoan && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      Final Payment
                    </span>
                  )}
                </div>
                <span className={`${colors.text.tertiary} text-xs`}>
                  Due: {new Date(month.dueDate).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className={colors.text.tertiary}>Principal: </span>
                  <span className={colors.text.primary}>
                    ₱{month.principalAmount.toLocaleString()}
                  </span>
                </div>
                {month.interestAmount > 0 && (
                  <div>
                    <span className={colors.text.tertiary}>Interest: </span>
                    <span className={colors.text.primary}>
                      ₱{month.interestAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className={month.interestAmount === 0 ? "col-span-2" : ""}>
                  <span className={colors.text.tertiary}>
                    {month.isLastPayment
                      ? "Final Payment: "
                      : isGLoan
                      ? "Payment Due: "
                      : "Amount Due: "}
                  </span>
                  <span className={`${colors.text.primary} font-semibold`}>
                    ₱{month.totalAmount.toLocaleString()}
                  </span>
                  {/* Show clear message for final payment */}
                  {month.isLastPayment && isGLoan && (
                    <div className="text-xs text-emerald-400 mt-1">
                      ✓ This amount will clear the loan completely
                    </div>
                  )}
                  {/* Show adjustment notice for non-final payments if different from standard */}
                  {!month.isLastPayment && month.isAdjustedFinalPayment && (
                    <div className="text-xs text-blue-400 mt-1">
                      (Standard: ₱{month.standardPaymentAmount.toLocaleString()}
                      )
                    </div>
                  )}
                </div>
                <div>
                  <span className={colors.text.tertiary}>Paid: </span>
                  <span
                    className={`font-semibold ${
                      month.isPaid
                        ? "text-emerald-400"
                        : month.paidAmount > 0
                        ? "text-amber-400"
                        : colors.text.tertiary
                    }`}
                  >
                    ₱{month.paidAmount.toLocaleString()}
                  </span>
                </div>
                {/* Add remaining balance display for GLoan */}
                {isGLoan && month.remainingBalance !== undefined && (
                  <div
                    className={`col-span-2 mt-1 pt-1 border-t ${colors.border.secondary}`}
                  >
                    <span className={colors.text.tertiary}>
                      Remaining Balance:{" "}
                    </span>
                    <span className="text-blue-400 font-medium">
                      ₱{month.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* GLoan specific information for last payment */}
              {month.isLastPayment && isGLoan && !month.isPaid && (
                <div className="mt-2 text-xs bg-blue-500/10 rounded p-2">
                  <div className="text-blue-400 font-medium mb-1">
                    Early Settlement Option:
                  </div>
                  <div className={colors.text.secondary}>
                    If settled early, interest will be prorated based on days
                    elapsed in this month
                  </div>
                </div>
              )}

              {month.isPaid && month.paidDate && (
                <div className="mt-2 text-xs text-emerald-400">
                  Paid on: {new Date(month.paidDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          {/* Summary Footer */}
          {isGLoan && (
            <div
              className={`mt-3 p-3 ${colors.background.secondary} rounded-lg`}
            >
              <div
                className={`text-xs ${colors.text.tertiary} text-center space-y-1`}
              >
                <div>GLoan Flat Add-on Interest Method</div>
                <div>
                  Interest calculated upfront:{" "}
                  {(loan.interestRate * 100).toFixed(2)}% × {totalMonths} months
                </div>
                <div>
                  Same installment amount each month (except early settlement)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyBreakdown;
