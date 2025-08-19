import getDueDateStatus from "../indicators/getDueDateStatus";
import Card from "../common/Card";
import PaymentHistory from "../payment/PaymentHistory";
import { Edit3, Trash2, Check, Upload, FileImage } from "lucide-react";
import MonthlyBreakdown from "../breakdown/MonthlyBreakdown";

const LoanList = ({
  loans,
  onEdit,
  onDelete,
  onUploadProof,
  onAddManualReceipt,
  onDeletePayment, // ADD this line
  highlightedLoanId,
}) => {
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="w-10 h-10 text-slate-400 text-5xl font-bold flex items-center justify-center">
            ₱
          </span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No loans yet</h3>
        <p className="text-slate-400 mb-6 max-w-sm">
          Start tracking your money by adding your first loan transaction
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 animate-in slide-in-from-bottom-4 duration-500"
      data-loans-container
    >
      {loans.map((loan, index) => {
        if (!loan) return null;

        const originalAmount = parseFloat(loan.amount) || 0;
        const remainingAmount =
          parseFloat(loan.remainingAmount) || originalAmount;
        const totalPaid = Math.max(0, originalAmount - remainingAmount);

        const dueDateStatus = getDueDateStatus(loan);

        // Ensure loan.id exists, fallback to index or create a unique ID
        const loanId = loan.id || `loan-${index}-${Date.now()}`;

        console.log("Rendering loan with ID:", loanId, "Loan object:", loan); // Debug log

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
                  <h3 className="text-base font-semibold text-white truncate mb-1">
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
                    {/* FIXED: Due date badge with proper coloring for due today */}
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
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
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
                <p className="text-slate-400 text-xs mb-1">Original</p>
                <p className="text-white font-semibold text-sm">
                  ₱{loan.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                {loan.status === "paid" ? (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Status</p>
                    <p className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" />
                      PAID
                    </p>
                  </>
                ) : remainingAmount === loan.amount ? (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Status</p>
                    <p className="text-amber-300 font-bold text-sm">UNPAID</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Remaining</p>
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
                  <span className="text-slate-400 text-xs">Progress</span>
                  <span className="text-slate-400 text-xs">
                    {((totalPaid / loan.amount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
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
                <p className="text-slate-400 text-xs">
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
                        : "text-slate-400"
                    }`}
                  >
                    Due:{" "}
                    {new Date(loan.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {dueDateStatus?.isOverdue}
                    {dueDateStatus?.status === "due-today"}
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
              <p className="text-slate-200 text-xs bg-slate-700/30 rounded-lg px-2 py-1 mb-3 line-clamp-2">
                {loan.description}
              </p>
            )}

            {/* Collapsible Payment History */}
            {hasPayments && (
              <div className="mb-3">
                <PaymentHistory
                  payments={loan.payments}
                  loan={loan}
                  onDeletePayment={onDeletePayment} // ADD this line
                />
              </div>
            )}

            {loan.monthlyBreakdown && (
              <div className="mb-3">
                <MonthlyBreakdown loan={loan} />
              </div>
            )}

            {/* NEW: Action buttons moved to bottom in a horizontal row */}
            <div className="flex gap-2 pt-2 border-t border-slate-600/30">
              {remainingAmount > 0 && loan.status === "active" && (
                <>
                  <button
                    onClick={() => onUploadProof(loan)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all duration-200 text-xs font-medium"
                    title="Upload proof"
                  >
                    <Upload className="w-3 h-3" />
                    Proof
                  </button>
                  <button
                    onClick={() => onAddManualReceipt(loan)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-green-500/20 text-slate-400 hover:text-green-400 rounded-lg transition-all duration-200 text-xs font-medium"
                    title="Manual receipt"
                  >
                    <FileImage className="w-3 h-3" />
                    Receipt
                  </button>
                </>
              )}
              <button
                onClick={() => onEdit(loan)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all duration-200 text-xs font-medium"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(loan)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200 text-xs font-medium"
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
    </div>
  );
};

export default LoanList;
