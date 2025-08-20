import { useState, useCallback } from "react";
import cloudinaryService from "../services/cloudinaryService";
import loanService from "../services/loanService";
import { updateBreakdownPayments } from "../utils/loanCalculations";

export const useLoanOperations = (user, showNotification) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanToDelete, setLoanToDelete] = useState(null);
  // Global processing state to prevent spam clicks and show loading
  const [processingCount, setProcessingCount] = useState(0);
  const isProcessing = processingCount > 0;
  const startOp = () => setProcessingCount((c) => c + 1);
  const endOp = () => setProcessingCount((c) => Math.max(0, c - 1));

  // Generic retry helper for flaky networks
  const withRetry = async (fn, { retries = 3, baseDelay = 200 } = {}) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= retries) throw error;
        const delay = baseDelay * Math.pow(1.5, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const handleSaveLoan = useCallback(
    async (loanData) => {
      if (!user?.uid) return { success: false, error: "No user ID" };

      startOp();
      try {
        if (loanData.id) {
          await withRetry(() => loanService.updateLoan(user.uid, loanData.id, loanData));
          showNotification("Loan updated successfully!");
        } else {
          await withRetry(() => loanService.addLoan(user.uid, loanData));
          showNotification("Loan added successfully!");
        }

        // Small delay to allow RTDB subscription to propagate
        await new Promise((resolve) => setTimeout(resolve, 50));

        return { success: true };
      } catch (error) {
        console.error("Error saving loan:", error);
        showNotification("Error saving loan: " + error.message, "error");
        return { success: false, error };
      } finally {
        endOp();
      }
    },
    [user?.uid, showNotification]
  );

  const handleDeleteLoan = useCallback(
    async (loanId) => {
      if (!user?.uid || !loanId) return;

      startOp();
      try {
        await withRetry(() => loanService.deleteLoan(user.uid, loanId));
        showNotification("Loan deleted successfully!");
        return { success: true };
      } catch (error) {
        showNotification("Error deleting loan: " + error.message, "error");
        return { success: false, error };
      } finally {
        endOp();
      }
    },
    [user?.uid, showNotification]
  );

  const handleProofUpload = useCallback(
    async (paymentData) => {
      if (!user?.uid || !selectedLoan) return;

      try {
        const { amount, proofUrl, proofPublicId } = paymentData;
        const loan = selectedLoan;
        const paymentAmount = parseFloat(amount);

        // VALIDATION: Check if payment exceeds amount due for next installment (and remaining balance)
        let currentRemaining =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const tolerance = 0.01; // 1 centavo tolerance

        // If breakdown exists, only restrict overpay on the FINAL installment
        if (Array.isArray(loan.monthlyBreakdown) && loan.monthlyBreakdown.length > 0) {
          const applied = updateBreakdownPayments(loan.monthlyBreakdown, loan.payments);
          const unpaid = applied.filter((m) => !m.isPaid);
          const nextUnpaid = unpaid[0];
          const isFinalInstallment = unpaid.length === 1 && nextUnpaid?.isLastPayment;
          if (isFinalInstallment && nextUnpaid) {
            const dueLeft = Math.max(
              0,
              (parseFloat(nextUnpaid.totalAmount) || 0) - (parseFloat(nextUnpaid.paidAmount) || 0)
            );
            const needed = Math.round(dueLeft * 100) / 100;
            if (paymentAmount > needed + tolerance) {
              showNotification(`Final installment due: ₱${needed.toLocaleString()}. Enter ≤ this amount.`, "error");
              return { success: false, error: "Payment exceeds final installment" };
            }
          }
        }

        if (paymentAmount > currentRemaining + tolerance) {
          showNotification(
            `Payment amount (₱${paymentAmount.toLocaleString()}) cannot exceed remaining balance (₱${currentRemaining.toLocaleString()})`,
            "error"
          );
          return { success: false, error: "Payment exceeds remaining balance" };
        }

        // Add payment record (with retry)
        startOp();
        const paymentKey = await withRetry(
          () => loanService.addPayment(user.uid, loan.id, {
            amount: paymentAmount,
            proofUrl,
            proofPublicId,
            timestamp: Date.now(),
          })
        );

        if (!paymentKey) {
          throw new Error("Failed to create payment record");
        }

        // Wait for Firebase to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        const currentRemainingCalc =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const paymentAmountCalc = parseFloat(amount);

        // Calculate and round to prevent floating point errors
        let newRemainingAmount = currentRemainingCalc - paymentAmountCalc;
        newRemainingAmount = Math.round(newRemainingAmount * 100) / 100;

        // CRITICAL FIX: If remaining is very close to zero (less than 2 centavos), set it to exactly zero
        // This handles cases where 659.95 - 659.94 = 0.009999999999990905 instead of 0.01
        if (newRemainingAmount < 0.02 && newRemainingAmount > -0.02) {
          newRemainingAmount = 0;
        }

        // Ensure it's not negative
        newRemainingAmount = Math.max(0, newRemainingAmount);

        const newStatus = newRemainingAmount === 0 ? "paid" : "active";

        // Update loan with retry mechanism
        await updateLoanWithRetry(
          user.uid,
          loan.id,
          newRemainingAmount,
          newStatus
        );

        showNotification(
          `Payment of ₱${paymentAmount.toLocaleString()} recorded successfully!${
            newRemainingAmount === 0
              ? " 🎉 Loan is now fully paid!"
              : ` Remaining: ₱${newRemainingAmount.toLocaleString()}`
          }`
        );

        endOp();
        return { success: true };
      } catch (error) {
        console.error("Error uploading proof:", error);
        showNotification("Error uploading proof: " + error.message, "error");
        endOp();
        return { success: false, error };
      }
    },
    [user?.uid, selectedLoan, showNotification]
  );

  const handleManualReceiptSave = useCallback(
    async (receiptData) => {
      if (!user?.uid || !selectedLoan) return;

      try {
        const { amount, ...receiptDetails } = receiptData;
        const loan = selectedLoan;
        const paymentAmount = parseFloat(amount);

        // VALIDATION: Check if payment exceeds amount due for next installment (and remaining balance)
        let currentRemaining =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const tolerance = 0.01; // 1 centavo tolerance

        // If breakdown exists, only restrict overpay on the FINAL installment
        if (Array.isArray(loan.monthlyBreakdown) && loan.monthlyBreakdown.length > 0) {
          const applied = updateBreakdownPayments(loan.monthlyBreakdown, loan.payments);
          const unpaid = applied.filter((m) => !m.isPaid);
          const nextUnpaid = unpaid[0];
          const isFinalInstallment = unpaid.length === 1 && nextUnpaid?.isLastPayment;
          if (isFinalInstallment && nextUnpaid) {
            const dueLeft = Math.max(
              0,
              (parseFloat(nextUnpaid.totalAmount) || 0) - (parseFloat(nextUnpaid.paidAmount) || 0)
            );
            const needed = Math.round(dueLeft * 100) / 100;
            if (paymentAmount > needed + tolerance) {
              showNotification(`Final installment due: ₱${needed.toLocaleString()}. Enter ≤ this amount.`, "error");
              return { success: false, error: "Payment exceeds final installment" };
            }
          }
        }

        if (paymentAmount > currentRemaining + tolerance) {
          showNotification(
            `Payment amount (₱${paymentAmount.toLocaleString()}) cannot exceed remaining balance (₱${currentRemaining.toLocaleString()})`,
            "error"
          );
          return { success: false, error: "Payment exceeds remaining balance" };
        }

        // Add manual payment record (with retry)
        startOp();
        const paymentKey = await withRetry(
          () => loanService.addPayment(user.uid, loan.id, {
            ...receiptDetails,
            amount: paymentAmount,
            type: "manual",
            timestamp: receiptData.timestamp || Date.now(),
          })
        );

        if (!paymentKey) {
          throw new Error("Failed to create payment record");
        }

        // Wait for Firebase to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        // ✅ Calculate new remaining amount with proper floating point handling
        const currentRemainingCalc =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const paymentAmountCalc = parseFloat(amount);

        // Calculate and round to prevent floating point errors
        let newRemainingAmount = currentRemainingCalc - paymentAmountCalc;
        newRemainingAmount = Math.round(newRemainingAmount * 100) / 100;

        // CRITICAL FIX: If remaining is very close to zero (less than 2 centavos), set it to exactly zero
        // This handles cases where 659.95 - 659.94 = 0.009999999999990905 instead of 0.01
        if (newRemainingAmount < 0.02 && newRemainingAmount > -0.02) {
          newRemainingAmount = 0;
        }

        // Ensure it's not negative
        newRemainingAmount = Math.max(0, newRemainingAmount);

        const newStatus = newRemainingAmount === 0 ? "paid" : "active";

        // Update loan with retry mechanism
        await updateLoanWithRetry(
          user.uid,
          loan.id,
          newRemainingAmount,
          newStatus
        );

        showNotification(
          `Payment of ₱${paymentAmount.toLocaleString()} recorded successfully!${
            newRemainingAmount === 0
              ? " 🎉 Loan is now fully paid!"
              : ` Remaining: ₱${newRemainingAmount.toLocaleString()}`
          }`
        );

        endOp();
        return { success: true };
      } catch (error) {
        console.error("Error saving manual receipt:", error);
        showNotification(
          "Error saving manual receipt: " + error.message,
          "error"
        );
        endOp();
        return { success: false, error };
      }
    },
    [user?.uid, selectedLoan, showNotification]
  );

  const handleDeletePayment = useCallback(
    async (payment, loan) => {
      if (!user?.uid || !payment || !loan) return;

      startOp();
      try {
        // Delete image from Cloudinary if exists
        if (payment.proofPublicId) {
          try {
            await cloudinaryService.deleteImage(payment.proofPublicId);
            // eslint-disable-next-line
          } catch (cloudinaryError) {
            // Continue even if Cloudinary deletion fails
          }
        }

        // Delete the payment and get refund amount
        const { refundAmount } = await withRetry(() =>
          loanService.deletePayment(user.uid, loan.id, payment.id)
        );

        // Update the loan with the refunded amount
        await withRetry(() =>
          loanService.updateLoanAfterPaymentDeletion(
            user.uid,
            loan.id,
            refundAmount
          )
        );

        showNotification(
          `Payment of ₱${refundAmount.toLocaleString()} deleted and refunded to loan balance`
        );

        endOp();
        return { success: true };
      } catch (error) {
        showNotification("Error deleting payment: " + error.message, "error");
        endOp();
        return { success: false, error };
      }
    },
    [user?.uid, showNotification]
  );

  // Helper function for retry mechanism
  const updateLoanWithRetry = async (
    userId,
    loanId,
    remainingAmount,
    status,
    maxRetries = 3
  ) => {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await loanService.updateLoanAfterPayment(
          userId,
          loanId,
          remainingAmount,
          status
        );
        return;
      } catch (updateError) {
        retryCount++;
        if (retryCount >= maxRetries) throw updateError;
        await new Promise((resolve) => setTimeout(resolve, 200 * retryCount));
      }
    }
  };

  return {
    selectedLoan,
    setSelectedLoan,
    editingLoan,
    setEditingLoan,
    loanToDelete,
    setLoanToDelete,
    handleSaveLoan,
    handleDeleteLoan,
    handleProofUpload,
    handleManualReceiptSave,
    handleDeletePayment,
    isProcessing,
  };
};
