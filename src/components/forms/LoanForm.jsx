import React, { useState, useEffect } from "react";
import ErrorMessage from "../indicators/ErrorMessage";
import Button from "../common/Button";
import ConfirmationModal from "../modal/ConfirmationModal";
import { X } from "lucide-react";
import { calculateMonthlyBreakdown } from "../../utils/loanCalculations";

const LoanForm = ({ loan, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    type: "lent",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // ADD this
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false); // ADD this
  const [originalData, setOriginalData] = useState(null); // ADD this

  const [interestRate, setInterestRate] = useState(0.05); // 5% default

  useEffect(() => {
    if (loan) {
      const loanData = {
        ...loan,
        amount: (loan.amount || 0).toString(),
        personName: loan.personName || "",
        type: loan.type || "lent",
        date: loan.date || new Date().toISOString().split("T")[0],
        dueDate: loan.dueDate || "",
        description: loan.description || "",
        status: loan.status || "active",
      };
      setFormData(loanData);
      setOriginalData(loanData); // Store original data
    } else {
      const newLoanData = {
        personName: "",
        amount: "",
        type: "lent",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        description: "",
        status: "active",
      };
      setFormData(newLoanData);
      setOriginalData(newLoanData);
    }
    setError("");
    setHasUnsavedChanges(false); // Reset unsaved changes
  }, [loan, open]);

  const checkForChanges = (newData) => {
    if (!originalData) return false;
    return JSON.stringify(newData) !== JSON.stringify(originalData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(formData.amount);

    if (!formData.personName?.trim()) {
      setError("Please enter person's name");
      return;
    }

    if (formData.personName.trim().length > 100) {
      setError("Person's name must be less than 100 characters");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (amount > 999999999) {
      setError("Amount is too large");
      return;
    }

    const monthlyBreakdown = formData.dueDate
      ? calculateMonthlyBreakdown(amount, formData.dueDate, interestRate)
      : null;

    onSave({
      ...formData,
      amount: amount,
      id: loan?.id || null,
      interestRate: interestRate,
      monthlyBreakdown: monthlyBreakdown?.monthlyBreakdown || null,
      totalInterest: monthlyBreakdown?.totalInterest || 0,
      totalAmountWithInterest: monthlyBreakdown?.totalAmount || amount,
    });
    setHasUnsavedChanges(false);
  };

  const updateFormData = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasUnsavedChanges(checkForChanges(newData)); // Check for changes
    if (error) setError("");
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {loan ? "Edit Loan" : "Add New Loan"}
              </h2>
              {/* ADD unsaved changes indicator */}
              {hasUnsavedChanges && (
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                  title="Unsaved changes"
                ></div>
              )}
            </div>
            <button
              onClick={handleClose} // CHANGE from onClose to handleClose
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[60vh] overflow-y-auto"
          >
            {/* ADD ErrorMessage component here */}
            <ErrorMessage error={error} onClose={() => setError("")} />

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Person Name
              </label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => updateFormData("personName", e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                placeholder="Enter person's name"
                required
                minLength="1"
                maxLength="100"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  ₱
                </span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Rest of the form remains the same */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["lent", "borrowed"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData("type", type)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.type === type
                        ? type === "lent"
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Money I {type === "lent" ? "Lent" : "Borrowed"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData("dueDate", e.target.value)}
                min={formData.date} // Prevent due date before loan date
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>

            {formData.dueDate && (
              <div className="space-y-3">
                <label className="block text-slate-300 text-sm font-medium">
                  Monthly Interest Rate
                </label>

                {/* Quick Select Buttons - Mobile Friendly */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    {
                      rate: 0,
                      label: "0%",
                      desc: "No Interest",
                      color: "bg-blue-500",
                    },
                    {
                      rate: 0.03,
                      label: "3%",
                      desc: "Low",
                      color: "bg-emerald-500",
                    },
                    {
                      rate: 0.05,
                      label: "5%",
                      desc: "Standard",
                      color: "bg-emerald-500",
                    },
                    {
                      rate: 0.07,
                      label: "7%",
                      desc: "High",
                      color: "bg-amber-500",
                    },
                  ].map((option) => (
                    <button
                      key={option.rate}
                      type="button"
                      onClick={() => setInterestRate(option.rate)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        interestRate === option.rate
                          ? `${option.color} text-white shadow-lg`
                          : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {option.label}
                      </div>
                      <div className="text-xs opacity-75">{option.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Rate Input - Compact Mobile Design */}
                <div className="bg-slate-700/20 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm font-medium">
                      Custom Rate
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={
                          interestRate === 0
                            ? "0"
                            : (interestRate * 100).toFixed(1)
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setInterestRate(value / 100);
                        }}
                        className="w-16 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        step="0.1"
                        min="0"
                        max="20"
                      />
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                  </div>

                  {/* Range Slider - Updated for Zero */}
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={interestRate * 100}
                    onChange={(e) =>
                      setInterestRate(parseFloat(e.target.value) / 100)
                    }
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${
                        interestRate === 0 ? "#3b82f6" : "#10b981"
                      } 0%, ${interestRate === 0 ? "#3b82f6" : "#10b981"} ${
                        interestRate * 100 * 5
                      }%, #475569 ${interestRate * 100 * 5}%, #475569 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0%</span>
                    <span>20%</span>
                  </div>
                </div>

                {/* Payment Preview - Mobile Optimized Card */}
                {formData.amount && formData.dueDate && (
                  <div
                    className={`border rounded-xl p-4 ${
                      interestRate === 0
                        ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20"
                        : "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          interestRate === 0 ? "bg-blue-400" : "bg-emerald-400"
                        }`}
                      ></div>
                      <span className="text-slate-200 font-medium text-sm">
                        {interestRate === 0
                          ? "Payment Plan (No Interest)"
                          : "Payment Preview"}
                      </span>
                    </div>

                    {(() => {
                      const preview = calculateMonthlyBreakdown(
                        parseFloat(formData.amount) || 0,
                        formData.dueDate,
                        interestRate
                      );
                      return preview ? (
                        <div className="space-y-2">
                          {/* Monthly Payment - Different styling for no interest */}
                          <div
                            className={`rounded-lg p-3 ${
                              interestRate === 0
                                ? "bg-blue-500/20"
                                : "bg-slate-700/30"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-slate-400 text-xs mb-1">
                                {interestRate === 0
                                  ? "Monthly Payment (Equal Splits)"
                                  : "Monthly Payment"}
                              </div>
                              <div
                                className={`font-bold text-lg ${
                                  interestRate === 0
                                    ? "text-blue-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                ₱{preview.monthlyPayment.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Summary Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                              <div className="text-slate-400 text-xs">
                                Total Amount
                              </div>
                              <div className="text-white font-semibold text-sm">
                                ₱{preview.totalAmount.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                              <div className="text-slate-400 text-xs">
                                {interestRate === 0
                                  ? "Interest Saved"
                                  : "Total Interest"}
                              </div>
                              <div
                                className={`font-semibold text-sm ${
                                  interestRate === 0
                                    ? "text-blue-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {interestRate === 0
                                  ? "₱0"
                                  : `₱${preview.totalInterest.toLocaleString()}`}
                              </div>
                            </div>
                          </div>

                          {/* Number of Payments with context */}
                          <div className="text-center">
                            <span className="text-slate-400 text-xs">
                              {preview.monthlyBreakdown.length} monthly payments
                              {interestRate === 0 ? " • Interest-free" : ""}
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                maxLength="500"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all duration-200"
                placeholder="Add a note about this loan..."
              />
              <div className="text-right mt-1">
                <span className="text-xs text-slate-400">
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["active", "paid"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateFormData("status", status)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.status === status
                        ? status === "active"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {status === "active" ? "Active" : "Paid"}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="flex gap-3 p-6 border-t border-slate-600/30">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {loan ? "Update" : "Add"} Loan
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirm={() => {
          setShowUnsavedWarning(false);
          setHasUnsavedChanges(false);
          onClose();
        }}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
      />
    </>
  );
};

export default LoanForm;
