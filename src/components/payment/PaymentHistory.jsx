import React, { useState, useMemo } from "react";
import ReceiptViewModal from "../modal/ReceiptViewModal";
import ConfirmationModal from "../modal/ConfirmationModal";
import {
  Trash2,
  FileImage,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const PaymentHistory = ({ payments = {}, loan, onDeletePayment }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const paymentsArray = useMemo(() => {
    if (!payments || typeof payments !== "object") {
      return [];
    }

    try {
      return Object.entries(payments)
        .filter(([, payment]) => payment && typeof payment === "object")
        .map(([paymentId, payment]) => ({
          ...payment,
          id: paymentId,
          amount: parseFloat(payment.amount) || 0,
          timestamp: payment.timestamp || Date.now(),
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
      console.error("Error processing payments:", error);
      return [];
    }
  }, [payments]);

  const handleViewReceipt = (payment) => {
    setSelectedReceipt({ payment, loan });
    setShowReceiptModal(true);
  };

  const handleDeleteReceipt = async (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (onDeletePayment && paymentToDelete) {
        await onDeletePayment(paymentToDelete, loan);
      }
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  if (!paymentsArray.length) {
    return (
      <div className="text-center py-4">
        <p className={`${colors.text.tertiary} text-sm`}>
          No payments recorded yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-2 ${colors.background.elevated} ${colors.interactive.hover} rounded-lg transition-colors duration-200`}
        >
          <div className="flex items-center gap-2">
            <History className={`w-4 h-4 ${colors.text.secondary}`} />
            <span className={`${colors.text.primary} font-medium text-sm`}>
              Payment History ({paymentsArray.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-4 h-4 ${colors.text.tertiary}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${colors.text.tertiary}`} />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {paymentsArray.map((payment, index) => (
              <div
                key={payment.id || index}
                className={`${colors.background.elevated} rounded-lg p-3`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-400 font-semibold text-sm">
                    ₱{(payment.amount || 0).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`${colors.text.tertiary} text-xs`}>
                      {payment.timestamp
                        ? new Date(payment.timestamp).toLocaleDateString()
                        : "Unknown"}
                    </span>
                    <button
                      onClick={() => handleDeleteReceipt(payment)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                      title="Delete payment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payment.type === "manual" ? (
                    <>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        Manual Receipt
                      </span>
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs underline"
                      >
                        View Receipt
                      </button>
                    </>
                  ) : (
                    payment.proofUrl && (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-xs"
                      >
                        <FileImage className="w-3 h-3" />
                        View Proof
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptViewModal
        payment={selectedReceipt?.payment}
        loan={selectedReceipt?.loan}
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment of ₱${(
          paymentToDelete?.amount || 0
        ).toLocaleString()}? This will add the amount back to the remaining loan balance and cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        type="danger"
      />
    </>
  );
};

export default PaymentHistory;
