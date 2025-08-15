import { useState, useCallback } from "react";
import cloudinaryService from "../services/cloudinaryService";
import loanService from "../services/loanService";

export const useLoanOperations = (user, showNotification) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const handleSaveLoan = useCallback(
    async (loanData) => {
      if (!user?.uid) return;

      try {
        if (loanData.id) {
          await loanService.updateLoan(user.uid, loanData.id, loanData);
          showNotification("Loan updated successfully!");
        } else {
          await loanService.addLoan(user.uid, loanData);
          showNotification("Loan added successfully!");
        }

        // Small delay to ensure Firebase processes the change
        await new Promise((resolve) => setTimeout(resolve, 100));

        return { success: true };
      } catch (error) {
        showNotification("Error saving loan: " + error.message, "error");
        return { success: false, error };
      }
    },
    [user?.uid, showNotification]
  );

  const handleDeleteLoan = useCallback(
    async (loanId) => {
      if (!user?.uid || !loanId) return;

      try {
        await loanService.deleteLoan(user.uid, loanId);
        showNotification("Loan deleted successfully!");
        return { success: true };
      } catch (error) {
        showNotification("Error deleting loan: " + error.message, "error");
        return { success: false, error };
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

        // Add payment record
        const paymentKey = await loanService.addPayment(user.uid, loan.id, {
          amount: parseFloat(amount),
          proofUrl,
          proofPublicId,
          timestamp: Date.now(),
        });

        if (!paymentKey) {
          throw new Error("Failed to create payment record");
        }

        // Wait for Firebase to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Calculate new remaining amount
        const currentRemaining =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const newRemainingAmount = Math.max(
          0,
          currentRemaining - parseFloat(amount)
        );
        const newStatus = newRemainingAmount === 0 ? "paid" : "active";

        // Update loan with retry mechanism
        await updateLoanWithRetry(
          user.uid,
          loan.id,
          newRemainingAmount,
          newStatus
        );

        showNotification(
          `Payment of ₱${parseFloat(
            amount
          ).toLocaleString()} recorded successfully!`
        );

        return { success: true };
      } catch (error) {
        showNotification("Error uploading proof: " + error.message, "error");
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

        // Add manual payment record
        const paymentKey = await loanService.addPayment(user.uid, loan.id, {
          ...receiptDetails,
          amount: parseFloat(amount),
          type: "manual",
          timestamp: receiptData.timestamp || Date.now(),
        });

        if (!paymentKey) {
          throw new Error("Failed to create payment record");
        }

        // Wait for Firebase to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Calculate new remaining amount
        const currentRemaining =
          parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
        const newRemainingAmount = Math.max(
          0,
          currentRemaining - parseFloat(amount)
        );
        const newStatus = newRemainingAmount === 0 ? "paid" : "active";

        // Update loan with retry mechanism
        await updateLoanWithRetry(
          user.uid,
          loan.id,
          newRemainingAmount,
          newStatus
        );

        showNotification(
          `Manual receipt of ₱${parseFloat(
            amount
          ).toLocaleString()} saved successfully!`
        );

        return { success: true };
      } catch (error) {
        showNotification(
          "Error saving manual receipt: " + error.message,
          "error"
        );
        return { success: false, error };
      }
    },
    [user?.uid, selectedLoan, showNotification]
  );

  const handleDeletePayment = useCallback(
    async (payment, loan) => {
      if (!user?.uid || !payment || !loan) return;

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
        const { refundAmount } = await loanService.deletePayment(
          user.uid,
          loan.id,
          payment.id
        );

        // Update the loan with the refunded amount
        await loanService.updateLoanAfterPaymentDeletion(
          user.uid,
          loan.id,
          refundAmount
        );

        showNotification(
          `Payment of ₱${refundAmount.toLocaleString()} deleted and refunded to loan balance`
        );

        return { success: true };
      } catch (error) {
        showNotification("Error deleting payment: " + error.message, "error");
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
  };
};
