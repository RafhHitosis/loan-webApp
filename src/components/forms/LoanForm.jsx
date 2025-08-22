import React, { useState, useEffect } from "react";
import ErrorMessage from "../indicators/ErrorMessage";
import Button from "../common/Button";
import ConfirmationModal from "../modal/ConfirmationModal";
import { X } from "lucide-react";
import { calculateMonthlyBreakdown } from "../../utils/loanCalculations";
import { useTheme } from "../../contexts/ThemeContext";

const LoanForm = ({ loan, open, onClose, onSave }) => {
  const { colors } = useTheme();

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const [interestRate, setInterestRate] = useState(0.05); // 5% default

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      const loanData = {
        ...loan,
        // When editing, show the original principal amount (not the total with interest)
        amount: (loan.originalPrincipal || loan.amount || 0).toString(),
        personName: loan.personName || "",
        type: loan.type || "lent",
        date: loan.date || new Date().toISOString().split("T")[0],
        dueDate: loan.dueDate || "",
        description: loan.description || "",
        status: loan.status || "active",
      };
      setFormData(loanData);
      setOriginalData({ ...loanData, interestRate: loan.interestRate || 0.05 });
      // Set interest rate from existing loan
      setInterestRate(loan.interestRate || 0.05);
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
      setOriginalData({ ...newLoanData, interestRate: 0.05 });
      // Reset to default interest rate for new loans
      setInterestRate(0.05);
    }
    setError("");
    setHasUnsavedChanges(false);
  }, [loan, open]);

  const checkForChanges = (newData, newInterestRate = interestRate) => {
    if (!originalData) return false;
    const currentState = { ...newData, interestRate: newInterestRate };
    return JSON.stringify(currentState) !== JSON.stringify(originalData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const principalAmount = parseFloat(formData.amount);

    if (!formData.personName?.trim()) {
      setError("Please enter person's name");
      setIsSubmitting(false);
      return;
    }

    if (formData.personName.trim().length > 100) {
      setError("Person's name must be less than 100 characters");
      setIsSubmitting(false);
      return;
    }

    if (!principalAmount || principalAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      setIsSubmitting(false);
      return;
    }

    if (principalAmount > 999999999) {
      setError("Amount is too large");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the loan date as start date for monthly breakdown calculation
      const monthlyBreakdown = formData.dueDate
        ? calculateMonthlyBreakdown(
            principalAmount,
            formData.dueDate,
            interestRate,
            formData.date
          )
        : null;

      // Calculate the total amount with interest to save as the main loan amount
      const totalAmountWithInterest =
        monthlyBreakdown?.totalAmount || principalAmount;

      const loanDataToSave = {
        ...formData,
        // Save the total amount with interest as the main loan amount
        amount: totalAmountWithInterest,
        // Keep track of the original principal for reference
        originalPrincipal: principalAmount,
        id: loan?.id || null,
        // IMPORTANT: Save the selected interest rate
        interestRate: interestRate,
        monthlyBreakdown: monthlyBreakdown?.monthlyBreakdown || null,
        totalInterest: monthlyBreakdown?.totalInterest || 0,
        totalAmountWithInterest: totalAmountWithInterest,
        // Additional GLoan specific fields
        processingFee: monthlyBreakdown?.processingFee || 0,
        netProceeds: monthlyBreakdown?.netProceeds || principalAmount,
      };

      console.log("Saving loan with interest rate:", interestRate); // Debug log

      const result = await onSave(loanDataToSave);

      if (result && result.success) {
        setHasUnsavedChanges(false);
        // Only close if save was successful
        onClose();
      }
    } catch (error) {
      console.error("Error saving loan:", error);
      setError(error.message || "Failed to save loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasUnsavedChanges(checkForChanges(newData));
    if (error) setError("");
  };

  const updateInterestRate = (newRate) => {
    setInterestRate(newRate);
    setHasUnsavedChanges(checkForChanges(formData, newRate));
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
        <div
          className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border sm:${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300`}
        >
          <div
            className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
          >
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${colors.text.primary}`}>
                {loan ? "Edit Loan" : "Add New Loan"}
              </h2>
              {hasUnsavedChanges && (
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                  title="Unsaved changes"
                ></div>
              )}
            </div>
            <button
              onClick={handleClose}
              className={`w-10 h-10 rounded-full ${
                colors.background.elevated
              } ${colors.interactive.hover} flex items-center justify-center ${
                colors.text.tertiary
              } hover:${colors.text.secondary.replace(
                "text-",
                ""
              )} transition-all duration-200`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <ErrorMessage error={error} onClose={() => setError("")} />

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Person Name
              </label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => updateFormData("personName", e.target.value)}
                className={`w-full px-4 py-3 ${
                  colors.background.elevated
                } border ${colors.border.primary} rounded-xl ${
                  colors.text.primary
                } ${colors.text.tertiary.replace(
                  "text-",
                  "placeholder-"
                )} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200`}
                placeholder="Enter person's name"
                required
                minLength="1"
                maxLength="100"
              />
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Principal Amount
                <span className={`${colors.text.tertiary} text-xs ml-1`}>
                  (Amount before interest)
                </span>
              </label>
              <div className="relative">
                <span
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary}`}
                >
                  ₱
                </span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className={`w-full pl-8 pr-4 py-3 ${
                    colors.background.elevated
                  } border ${colors.border.primary} rounded-xl ${
                    colors.text.primary
                  } ${colors.text.tertiary.replace(
                    "text-",
                    "placeholder-"
                  )} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200`}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
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
                        : `${colors.background.elevated} ${colors.text.secondary} ${colors.interactive.hover}`
                    }`}
                  >
                    Money I {type === "lent" ? "Lent" : "Borrowed"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className={`w-full px-4 py-3 ${colors.background.elevated} border ${colors.border.primary} rounded-xl ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200`}
                required
              />
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData("dueDate", e.target.value)}
                min={formData.date}
                className={`w-full px-4 py-3 ${colors.background.elevated} border ${colors.border.primary} rounded-xl ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200`}
              />
            </div>

            {formData.dueDate && (
              <div className="space-y-3">
                <label
                  className={`block ${colors.text.secondary} text-sm font-medium`}
                >
                  Monthly Interest Rate
                </label>

                {/* Quick Select Buttons - Updated with decimal support */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    {
                      rate: 0,
                      label: "0%",
                      desc: "No Interest",
                      color: "bg-blue-500",
                    },
                    {
                      rate: 0.0359,
                      label: "3.59%",
                      desc: "GLoan Rate",
                      color: "bg-emerald-500",
                    },
                    {
                      rate: 0.05,
                      label: "5%",
                      desc: "Standard",
                      color: "bg-amber-500",
                    },
                  ].map((option) => (
                    <button
                      key={option.rate}
                      type="button"
                      onClick={() => updateInterestRate(option.rate)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        Math.abs(interestRate - option.rate) < 0.0001
                          ? `${option.color} text-white shadow-lg`
                          : `${colors.background.elevated} ${colors.text.secondary} ${colors.interactive.hover}`
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {option.label}
                      </div>
                      <div className="text-xs opacity-75">{option.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Rate Input - Enhanced for decimal precision */}
                <div
                  className={`${colors.background.secondary} rounded-xl p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`${colors.text.secondary} text-sm font-medium`}
                    >
                      Custom Rate
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={
                          interestRate === 0
                            ? "0"
                            : (interestRate * 100).toFixed(2)
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateInterestRate(value / 100);
                        }}
                        className={`w-20 px-2 py-1 ${colors.background.elevated} border ${colors.border.primary} rounded-lg ${colors.text.primary} text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50`}
                        step="0.01"
                        min="0"
                        max="20"
                      />
                      <span className={`${colors.text.tertiary} text-sm`}>
                        %
                      </span>
                    </div>
                  </div>

                  {/* Range Slider - Updated for finer control */}
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.01"
                    value={interestRate * 100}
                    onChange={(e) =>
                      updateInterestRate(parseFloat(e.target.value) / 100)
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
                  <div
                    className={`flex justify-between text-xs ${colors.text.tertiary} mt-1`}
                  >
                    <span>0%</span>
                    <span>20%</span>
                  </div>

                  {/* Display exact percentage */}
                  <div
                    className={`text-center text-xs ${colors.text.tertiary} mt-1`}
                  >
                    Current: {(interestRate * 100).toFixed(2)}% monthly
                  </div>
                </div>

                {/* GLoan Payment Preview - Using loan start date */}
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
                      <span
                        className={`${colors.text.primary} font-medium text-sm`}
                      >
                        {interestRate === 0
                          ? "Payment Plan (No Interest)"
                          : "GLoan Preview (Flat Add-on)"}
                      </span>
                    </div>

                    {(() => {
                      // Use the loan date as start date for calculation
                      const preview = calculateMonthlyBreakdown(
                        parseFloat(formData.amount) || 0,
                        formData.dueDate,
                        interestRate,
                        formData.date // Pass the loan date as start date
                      );
                      return preview ? (
                        <div className="space-y-2">
                          {/* Total Loan Amount Warning */}
                          {interestRate > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-2">
                              <div className="text-center">
                                <div className="text-amber-400 text-xs font-medium mb-1">
                                  ⚠️ Important: Loan Amount Saved
                                </div>
                                <div className="text-amber-300 text-sm">
                                  Principal: ₱
                                  {parseFloat(formData.amount).toLocaleString()}
                                </div>
                                <div className="text-amber-400 text-sm font-semibold">
                                  Total Loan Amount: ₱
                                  {preview.totalAmount.toLocaleString()}
                                </div>
                                <div className="text-amber-300 text-xs mt-1">
                                  (This total will be saved as the main loan
                                  amount)
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Processing Fee & Net Proceeds - GLoan specific */}
                          {interestRate > 0 && (
                            <div
                              className={`${colors.background.secondary} border ${colors.border.secondary} rounded-lg p-3 mb-2`}
                            >
                              <div className="text-center mb-2">
                                <div
                                  className={`${colors.text.secondary} text-xs font-medium`}
                                >
                                  GLoan Processing
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-center">
                                  <div
                                    className={`${colors.text.tertiary} text-xs`}
                                  >
                                    Processing Fee (3%)
                                  </div>
                                  <div className="text-red-400 font-semibold text-sm">
                                    -₱{preview.processingFee.toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div
                                    className={`${colors.text.tertiary} text-xs`}
                                  >
                                    Net Proceeds
                                  </div>
                                  <div className="text-emerald-400 font-semibold text-sm">
                                    ₱{preview.netProceeds.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Monthly Payment */}
                          <div
                            className={`rounded-lg p-3 ${
                              interestRate === 0
                                ? "bg-blue-500/20"
                                : `${colors.background.elevated}`
                            }`}
                          >
                            <div className="text-center">
                              <div
                                className={`${colors.text.tertiary} text-xs mb-1`}
                              >
                                {interestRate === 0
                                  ? "Monthly Payment (Equal Splits)"
                                  : "Standard Monthly Payment"}
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
                              {/* Show breakdown of monthly payment */}
                              {interestRate > 0 && (
                                <div
                                  className={`text-xs ${colors.text.tertiary} mt-1`}
                                >
                                  ₱{preview.principalPerMonth.toLocaleString()}{" "}
                                  avg. principal + ₱
                                  {preview.interestPerMonth.toLocaleString()}{" "}
                                  avg. interest
                                </div>
                              )}
                              {/* Add note about final payment adjustment */}
                              {interestRate > 0 && (
                                <div className="text-xs text-blue-400 mt-1">
                                  *Final payment may be slightly adjusted
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Summary Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div
                              className={`${colors.background.secondary} rounded-lg p-2 text-center`}
                            >
                              <div
                                className={`${colors.text.tertiary} text-xs`}
                              >
                                Total Repayment
                              </div>
                              <div
                                className={`${colors.text.primary} font-semibold text-sm`}
                              >
                                ₱{preview.totalAmount.toLocaleString()}
                              </div>
                            </div>
                            <div
                              className={`${colors.background.secondary} rounded-lg p-2 text-center`}
                            >
                              <div
                                className={`${colors.text.tertiary} text-xs`}
                              >
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

                          {/* GLoan Formula Info */}
                          {interestRate > 0 && (
                            <div
                              className={`${colors.background.secondary} rounded-lg p-2 text-center`}
                            >
                              <div
                                className={`${colors.text.tertiary} text-xs`}
                              >
                                Formula: (₱
                                {parseFloat(formData.amount).toLocaleString()} +
                                ₱{preview.totalInterest.toLocaleString()}) ÷{" "}
                                {preview.monthlyBreakdown.length} months
                              </div>
                            </div>
                          )}

                          {/* Number of Payments with context */}
                          <div className="text-center">
                            <span className={`${colors.text.tertiary} text-xs`}>
                              {preview.monthlyBreakdown.length} monthly payments
                              {interestRate === 0
                                ? " • Interest-free"
                                : " • Flat add-on interest"}
                            </span>
                          </div>

                          {/* Show date range for clarity */}
                          <div className="text-center">
                            <span className={`${colors.text.muted} text-xs`}>
                              From{" "}
                              {new Date(formData.date).toLocaleDateString()} to{" "}
                              {new Date(formData.dueDate).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Early settlement note */}
                          {interestRate > 0 && (
                            <div className="text-center">
                              <span className="text-blue-400 text-xs">
                                💡 Early settlement available with prorated last
                                month interest
                              </span>
                            </div>
                          )}

                          {/* Interest Rate Confirmation */}
                          <div className="text-center">
                            <span className="text-emerald-400 text-xs font-medium">
                              📊 Interest Rate:{" "}
                              {(interestRate * 100).toFixed(2)}% monthly will be
                              saved
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
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                maxLength="500"
                className={`w-full px-4 py-3 ${
                  colors.background.elevated
                } border ${colors.border.primary} rounded-xl ${
                  colors.text.primary
                } ${colors.text.tertiary.replace(
                  "text-",
                  "placeholder-"
                )} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all duration-200`}
                placeholder="Add a note about this loan..."
              />
              <div className="text-right mt-1">
                <span className={`text-xs ${colors.text.tertiary}`}>
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
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
                        : `${colors.background.elevated} ${colors.text.secondary} ${colors.interactive.hover}`
                    }`}
                  >
                    {status === "active" ? "Active" : "Paid"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex gap-3 p-6 border-t ${colors.border.secondary}`}>
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {loan ? "Updating..." : "Adding..."}
                </>
              ) : (
                `${loan ? "Update" : "Add"} Loan`
              )}
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
