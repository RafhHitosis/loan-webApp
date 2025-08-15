import React, { useState, useEffect } from "react";
import ErrorMessage from "../indicators/ErrorMessage";
import Button from "../common/Button";
import ConfirmationModal from "../modal/ConfirmationModal";
import { X } from "lucide-react";

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

    onSave({
      ...formData,
      amount: amount,
      id: loan?.id || null,
    });
    setHasUnsavedChanges(false); // Reset after save
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
