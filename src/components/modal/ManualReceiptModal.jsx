import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ErrorMessage from "./../indicators/ErrorMessage";
import Button from "./../common/Button";
import { useTheme } from "../../contexts/ThemeContext";

const ManualReceiptModal = ({ loan, open, onClose, onSave }) => {
  const { colors, isDarkMode } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    witnessName: "",
    witnessContact: "",
    description: "",
    paymentMethod: "cash",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        location: "",
        witnessName: "",
        witnessContact: "",
        description: "",
        paymentMethod: "cash",
      });
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const amount = parseFloat(formData.amount);
    const maxAmount = parseFloat(loan?.remainingAmount) || 0;

    // Validation
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      setIsSubmitting(false);
      return;
    }

    if (amount > maxAmount) {
      setError(
        `Payment amount cannot exceed remaining amount of ₱${maxAmount.toLocaleString()}`
      );
      setIsSubmitting(false);
      return;
    }

    if (!formData.location.trim()) {
      setError("Please enter the location where payment was made");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await onSave({
        ...formData,
        amount: amount,
        type: "manual",
        receiptId: `MR-${Date.now()}`,
        timestamp: new Date(`${formData.date}T${formData.time}`).getTime(),
      });

      // Only close if save was successful
      if (result && result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Save failed:", error);
      setError(`Failed to save receipt: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  if (!open) return null;

  // Input styles based on theme
  const inputBaseClasses = `w-full px-3 py-2.5 ${colors.background.elevated} ${colors.border.primary} rounded-lg ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm`;
  const placeholderClasses = isDarkMode
    ? "placeholder-slate-400"
    : "placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border ${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300 shadow-2xl`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
        >
          <h2 className={`text-xl font-bold ${colors.text.primary}`}>
            Manual Receipt
          </h2>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full ${colors.background.elevated} ${colors.interactive.hover} flex items-center justify-center ${colors.text.tertiary} hover:${colors.text.secondary} transition-all duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <ErrorMessage error={error} onClose={() => setError("")} />

          {/* Amount and Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Amount
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} text-sm`}
                >
                  ₱
                </span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className={`${inputBaseClasses} pl-7 ${placeholderClasses}`}
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
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className={inputBaseClasses}
                required
              />
            </div>
          </div>

          {/* Time and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => updateFormData("time", e.target.value)}
                className={inputBaseClasses}
                required
              />
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  updateFormData("paymentMethod", e.target.value)
                }
                className={inputBaseClasses}
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
            >
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              className={`${inputBaseClasses} ${placeholderClasses}`}
              placeholder="Where was the payment made?"
              required
            />
          </div>

          {/* Witness Information */}
          <div className="space-y-3">
            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Witness Name{" "}
                <span className={`${colors.text.muted} text-xs`}>
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                value={formData.witnessName}
                onChange={(e) => updateFormData("witnessName", e.target.value)}
                className={`${inputBaseClasses} ${placeholderClasses}`}
                placeholder="Full name"
              />
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Witness Contact{" "}
                <span className={`${colors.text.muted} text-xs`}>
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                value={formData.witnessContact}
                onChange={(e) =>
                  updateFormData("witnessContact", e.target.value)
                }
                className={`${inputBaseClasses} ${placeholderClasses}`}
                placeholder="Phone/Email"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
            >
              Notes (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
              maxLength="200"
              className={`${inputBaseClasses} ${placeholderClasses} resize-none`}
              placeholder="Additional details about the payment..."
            />
            <div className="text-right mt-1">
              <span className={`text-xs ${colors.text.tertiary}`}>
                {formData.description.length}/200
              </span>
            </div>
          </div>
        </form>

        <div className={`flex gap-3 p-6 border-t ${colors.border.secondary}`}>
          <Button variant="ghost" onClick={onClose} className="flex-1">
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
                Saving...
              </>
            ) : (
              "Save Receipt"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualReceiptModal;
