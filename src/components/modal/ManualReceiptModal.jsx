import React, { useState, useEffect } from "react";

const ManualReceiptModal = ({ loan, open, onClose, onSave }) => {
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
    setError("");

    const amount = parseFloat(formData.amount);
    const maxAmount = parseFloat(loan?.remainingAmount) || 0;

    // Validation
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (amount > maxAmount) {
      setError(
        `Payment amount cannot exceed remaining amount of ₱${maxAmount.toLocaleString()}`
      );
      return;
    }

    if (!formData.location.trim()) {
      setError("Please enter the location where payment was made");
      return;
    }

    try {
      // Call onSave and wait for it to complete
      await onSave({
        ...formData,
        amount: amount,
        type: "manual",
        receiptId: `MR-${Date.now()}`,
        timestamp: new Date(`${formData.date}T${formData.time}`).getTime(),
      });

      // Don't call onClose here - let the parent component handle it
    } catch (error) {
      console.error("Save failed:", error);
      setError(`Failed to save receipt: ${error.message}`);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
          <h2 className="text-xl font-bold text-white">Manual Receipt</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <ErrorMessage error={error} onClose={() => setError("")} />

          {/* Amount and Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
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
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                required
              />
            </div>
          </div>

          {/* Time and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => updateFormData("time", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  updateFormData("paymentMethod", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
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
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              placeholder="Where was the payment made?"
              required
            />
          </div>

          {/* Witness Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Witness Name{" "}
                <span className="text-slate-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.witnessName}
                onChange={(e) => updateFormData("witnessName", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Witness Contact{" "}
                <span className="text-slate-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.witnessContact}
                onChange={(e) =>
                  updateFormData("witnessContact", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-small"
                placeholder="Phone/Email"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
              maxLength="200"
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none text-sm"
              placeholder="Additional details about the payment..."
            />
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">
                {formData.description.length}/200
              </span>
            </div>
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-slate-600/30">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            {" "}
            {/* CHANGE from form submit to onClick */}
            Save Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualReceiptModal;
