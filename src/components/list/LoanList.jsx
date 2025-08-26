import React, { useState, useEffect } from "react";
import getDueDateStatus from "../indicators/getDueDateStatus";
import Card from "../common/Card";
import PaymentHistory from "../payment/PaymentHistory";
import {
  Edit3,
  Trash2,
  Check,
  Upload,
  FileImage,
  X,
  CreditCard,
  ChevronUp,
} from "lucide-react";
import MonthlyBreakdown from "../breakdown/MonthlyBreakdown";
import { updateBreakdownPayments } from "../../utils/loanCalculations";
import { useTheme } from "../../contexts/ThemeContext";

const PaymentOptionsModal = ({
  loan,
  open,
  onClose,
  onUploadProof,
  onAddManualReceipt,
}) => {
  const { colors } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border sm:${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {loan?.personName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${colors.text.primary}`}>
                Record Payment
              </h2>
              <p className={`text-sm ${colors.text.secondary}`}>
                {loan?.personName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full ${colors.background.elevated} ${
              colors.interactive.hover
            } flex items-center justify-center ${
              colors.text.tertiary
            } hover:${colors.text.secondary.replace(
              "text-",
              ""
            )} transition-all duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <p
              className={`${colors.text.secondary} text-sm font-medium text-center mb-4`}
            >
              How would you like to record this payment?
            </p>

            <button
              onClick={() => {
                onUploadProof(loan);
                onClose();
              }}
              className={`w-full p-4 ${colors.background.elevated} ${colors.border.primary} border rounded-xl ${colors.interactive.hover} transition-all duration-200 group`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`${colors.text.primary} font-semibold mb-1`}>
                    Upload Proof
                  </h3>
                  <p className={`${colors.text.tertiary} text-sm`}>
                    Upload a photo or document as payment proof
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onAddManualReceipt(loan);
                onClose();
              }}
              className={`w-full p-4 ${colors.background.elevated} ${colors.border.primary} border rounded-xl ${colors.interactive.hover} transition-all duration-200 group`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileImage className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`${colors.text.primary} font-semibold mb-1`}>
                    Manual Receipt
                  </h3>
                  <p className={`${colors.text.tertiary} text-sm`}>
                    Enter payment details manually with receipt info
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className={`p-6 border-t ${colors.border.secondary}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 ${colors.background.elevated} ${colors.text.secondary} rounded-xl ${colors.interactive.hover} transition-all duration-200 font-medium`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ScrollToTopButton = () => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled up to given distance
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const loansContainer = document.querySelector("[data-loans-container]");
    if (loansContainer) {
      loansContainer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-40
        w-12 h-12
        ${colors.background.card}
        ${colors.border.primary}
        border
        rounded-full
        shadow-lg hover:shadow-xl
        backdrop-blur-sm
        ${colors.interactive.hover}
        transition-all duration-300
        group
        animate-in slide-in-from-bottom-2
        hover:scale-110
        active:scale-95
      `}
      title="Scroll to top"
      aria-label="Scroll to top"
    >
      <ChevronUp
        className={`
          w-5 h-5 
          ${colors.text.primary} 
          group-hover:text-emerald-400
          transition-colors duration-200
          mx-auto
        `}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
};

const LoanList = ({
  loans,
  onEdit,
  onDelete,
  onUploadProof,
  onAddManualReceipt,
  onDeletePayment,
  highlightedLoanId,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [paymentModalLoan, setPaymentModalLoan] = useState(null);

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in slide-in-from-bottom-4 duration-500">
        <div
          className={`w-20 h-20 ${colors.background.elevated} rounded-3xl flex items-center justify-center mx-auto mb-6`}
        >
          <span
            className={`w-10 h-10 ${colors.text.tertiary} text-5xl font-bold flex items-center justify-center`}
          >
            ₱
          </span>
        </div>
        <h3 className={`text-xl font-semibold ${colors.text.primary} mb-2`}>
          No loans yet
        </h3>
        <p className={`${colors.text.tertiary} mb-6 max-w-sm`}>
          Start tracking your money by adding your first loan transaction
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="space-y-4 animate-in slide-in-from-bottom-4 duration-500"
        data-loans-container
      >
        {loans.map((loan, index) => {
          if (!loan) return null;

          const originalAmount = parseFloat(loan.amount) || 0;
          // Robust remaining calculation and rounding
          const rawRemaining = parseFloat(loan.remainingAmount);
          let remainingAmount = Number.isFinite(rawRemaining)
            ? rawRemaining
            : originalAmount;

          // If monthly breakdown exists, recompute remaining from installments with applied payments
          if (
            Array.isArray(loan.monthlyBreakdown) &&
            loan.monthlyBreakdown.length > 0
          ) {
            const applied = updateBreakdownPayments(
              loan.monthlyBreakdown,
              loan.payments
            );
            const recomputed = applied.reduce((sum, m) => {
              const total = parseFloat(m.totalAmount) || 0;
              const paid = parseFloat(m.paidAmount) || 0;
              const dueLeft = Math.max(0, total - paid);
              return sum + dueLeft;
            }, 0);
            remainingAmount = recomputed;
          }

          // Normalize to 2 decimals and zero-out tiny residuals
          remainingAmount = Math.round(remainingAmount * 100) / 100;
          if (remainingAmount <= 0.01) {
            remainingAmount = 0;
          }

          const totalPaid = Math.max(0, originalAmount - remainingAmount);
          const dueDateStatus = getDueDateStatus(loan);
          const loanId = loan.id || `loan-${index}-${Date.now()}`;

          // Compute payments array directly, not using useMemo
          let payments = [];
          if (loan.payments && typeof loan.payments === "object") {
            try {
              payments = Object.values(loan.payments)
                .filter((payment) => payment && typeof payment === "object")
                .map((payment) => ({
                  ...payment,
                  amount: parseFloat(payment.amount) || 0,
                  timestamp: payment.timestamp || Date.now(),
                }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            } catch (error) {
              console.error(
                "Error processing payments for loan:",
                loan.id,
                error
              );
              payments = [];
            }
          }

          const hasPayments = payments.length > 0;

          return (
            <Card
              key={loanId}
              className={`animate-in slide-in-from-bottom-2 p-4 relative transition-all duration-500 ${
                dueDateStatus?.isOverdue
                  ? "ring-2 ring-red-400/50 shadow-lg shadow-red-500/10 border-red-400/30 bg-red-500/5"
                  : dueDateStatus?.isDueSoon
                  ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10 border-amber-400/30 bg-amber-500/5"
                  : ""
              } ${dueDateStatus?.isOverdue ? "animate-pulse" : ""} ${
                highlightedLoanId === loan.id
                  ? "ring-4 ring-emerald-400/70 shadow-2xl shadow-emerald-500/20 animate-pulse scale-105"
                  : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              data-loan-id={loanId}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                    {loan.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-base font-semibold ${colors.text.primary} truncate mb-1`}
                    >
                      {loan.personName}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          loan.type === "lent"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {loan.type === "lent" ? "Lent" : "Borrowed"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          loan.status === "active"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {loan.status === "active" ? "Active" : "Paid"}
                      </span>
                      {dueDateStatus && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            dueDateStatus.status === "overdue" ||
                            dueDateStatus.status === "due-today"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                              : dueDateStatus.status === "due-soon"
                              ? "bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse"
                              : dueDateStatus.status === "upcoming"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : `${
                                  isDarkMode
                                    ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                    : "bg-gray-500/20 text-gray-500 border border-gray-500/30"
                                }`
                          }`}
                        >
                          {dueDateStatus.status === "overdue"
                            ? `${dueDateStatus.days}d overdue`
                            : dueDateStatus.status === "due-today"
                            ? "Due today"
                            : dueDateStatus.status === "due-soon"
                            ? `Due in ${dueDateStatus.days}d`
                            : `${dueDateStatus.days}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Amount Info */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <p className={`${colors.text.tertiary} text-xs mb-1`}>
                    Original
                  </p>
                  <p className={`${colors.text.primary} font-semibold text-sm`}>
                    ₱{loan.amount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  {loan.status === "paid" || remainingAmount === 0 ? (
                    <>
                      <p className={`${colors.text.tertiary} text-xs mb-1`}>
                        Status
                      </p>
                      <p className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" />
                        PAID
                      </p>
                    </>
                  ) : remainingAmount === originalAmount ? (
                    <>
                      <p className={`${colors.text.tertiary} text-xs mb-1`}>
                        Status
                      </p>
                      <p className="text-amber-300 font-bold text-sm">UNPAID</p>
                    </>
                  ) : (
                    <>
                      <p className={`${colors.text.tertiary} text-xs mb-1`}>
                        Remaining
                      </p>
                      <p className="text-amber-300 font-bold text-base">
                        ₱{remainingAmount.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar - Only show if there are payments */}
              {totalPaid > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`${colors.text.tertiary} text-xs`}>
                      Progress
                    </span>
                    <span className={`${colors.text.tertiary} text-xs`}>
                      {((totalPaid / loan.amount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className={`w-full ${
                      isDarkMode ? "bg-slate-700/50" : "bg-gray-200"
                    } rounded-full h-1.5`}
                  >
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(totalPaid / loan.amount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Compact Date and Description */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <p className={`${colors.text.tertiary} text-xs`}>
                    Created:{" "}
                    {new Date(loan.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {loan.dueDate && (
                    <p
                      className={`text-xs mt-0.5 ${
                        dueDateStatus?.isOverdue
                          ? "text-red-400 font-bold animate-pulse"
                          : dueDateStatus?.isDueSoon
                          ? "text-amber-400 font-semibold"
                          : colors.text.tertiary
                      }`}
                    >
                      Due:{" "}
                      {new Date(loan.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                {totalPaid > 0 && (
                  <p className="text-emerald-400 text-xs font-medium">
                    ₱{totalPaid.toLocaleString()} paid
                  </p>
                )}
              </div>

              {loan.description && (
                <p
                  className={`${colors.text.secondary} text-xs ${
                    isDarkMode ? "bg-slate-700/30" : "bg-gray-100"
                  } rounded-lg px-2 py-1 mb-3 line-clamp-2`}
                >
                  {loan.description}
                </p>
              )}

              {/* Collapsible Payment History */}
              {hasPayments && (
                <div className="mb-3">
                  <PaymentHistory
                    payments={loan.payments}
                    loan={loan}
                    onDeletePayment={onDeletePayment}
                  />
                </div>
              )}

              {loan.monthlyBreakdown && (
                <div className="mb-3">
                  <MonthlyBreakdown loan={loan} />
                </div>
              )}

              {/* Action buttons - Modified to have single Pay button */}
              <div
                className={`flex gap-2 pt-2 border-t ${colors.border.primary}`}
              >
                {remainingAmount > 0 && loan.status === "active" && (
                  <button
                    onClick={() => setPaymentModalLoan(loan)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 text-xs font-medium shadow-lg hover:shadow-xl`}
                    title="Record payment"
                  >
                    <CreditCard className="w-3 h-3" />
                    Pay
                  </button>
                )}
                <button
                  onClick={() => onEdit(loan)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 ${colors.background.elevated} hover:bg-emerald-500/20 ${colors.text.tertiary} hover:text-emerald-400 rounded-lg transition-all duration-200 text-xs font-medium`}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(loan)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 ${colors.background.elevated} hover:bg-red-500/20 ${colors.text.tertiary} hover:text-red-400 rounded-lg transition-all duration-200 text-xs font-medium`}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>

              {/* Latest Proof Link - Only if no payment history shown */}
              {hasPayments &&
                !hasPayments &&
                (() => {
                  const latestWithProof = payments.find((p) => p.proofUrl);
                  return latestWithProof?.proofUrl ? (
                    <a
                      href={latestWithProof.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      <FileImage className="w-3 h-3" />
                      Latest Proof
                    </a>
                  ) : null;
                })()}
            </Card>
          );
        })}

        {/* Show scroll to top button only when there are more than 6 loans */}
        {loans.length > 6 && (
          <div className="flex justify-center pt-6 pb-2">
            <button
              onClick={() => {
                const loansContainer = document.querySelector(
                  "[data-loans-container]"
                );
                if (loansContainer) {
                  loansContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                } else {
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }
              }}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5
                ${colors.background.card}
                ${colors.border.primary}
                border
                rounded-full
                ${colors.text.secondary}
                hover:${colors.text.primary}
                ${colors.interactive.hover}
                transition-all duration-200
                text-sm font-medium
                shadow-lg hover:shadow-xl
                backdrop-blur-sm
                group
                hover:scale-105
                active:scale-95
              `}
              title="Scroll to top of loan list"
              aria-label="Scroll to top of loan list"
            >
              <ChevronUp className="w-4 h-4 group-hover:text-emerald-400 transition-colors duration-200" />
              <span className="group-hover:text-emerald-400 transition-colors duration-200">
                Back to top
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>
        )}
      </div>

      {/* Floating scroll to top button for when scrolled down */}
      {loans.length > 6 && <ScrollToTopButton />}

      <PaymentOptionsModal
        loan={paymentModalLoan}
        open={!!paymentModalLoan}
        onClose={() => setPaymentModalLoan(null)}
        onUploadProof={onUploadProof}
        onAddManualReceipt={onAddManualReceipt}
      />
    </>
  );
};

export default LoanList;
