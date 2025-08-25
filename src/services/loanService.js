import {
  ref,
  push,
  set,
  remove,
  onValue,
  off,
  get,
  update,
} from "firebase/database";
import { database } from "./../lib/firebase";

const loanService = {
  getUserLoansRef: (userId) => ref(database, `loans/${userId}`),

  addLoan: async (userId, loanData) => {
    const loansRef = loanService.getUserLoansRef(userId);
    return await push(loansRef, {
      ...loanData,
      remainingAmount: loanData.amount,
      payments: {},
      monthlyBreakdown: loanData.monthlyBreakdown || null, // ADD this
      interestRate: loanData.interestRate || 0, // ADD this
      totalInterest: loanData.totalInterest || 0, // ADD this
      totalAmountWithInterest:
        loanData.totalAmountWithInterest || loanData.amount, // ADD this
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  updateLoan: async (userId, loanId, loanData) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    const loanRef = ref(database, `loans/${userId}/${loanId}`);

    try {
      // Get current loan data first to preserve payments
      const currentSnapshot = await get(loanRef);
      const currentLoan = currentSnapshot.val();

      if (!currentLoan) {
        throw new Error("Loan not found");
      }

      // Calculate total paid from payments
      const payments = currentLoan.payments || {};
      const totalPaid = Object.values(payments).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);

      // Calculate new remaining amount based on new loan amount
      const newAmount = parseFloat(loanData.amount) || 0;
      let newRemainingAmount = Math.max(0, newAmount - totalPaid);
      // Normalize to 2 decimals and zero-out tiny residuals
      newRemainingAmount = Math.round(newRemainingAmount * 100) / 100;
      if (newRemainingAmount <= 0.01) newRemainingAmount = 0;

      // Determine new status
      let newStatus = loanData.status || currentLoan.status || "active";
      if (newRemainingAmount === 0 && totalPaid > 0) {
        newStatus = "paid";
      } else if (newRemainingAmount > 0 && totalPaid > 0) {
        newStatus = "active"; // Partially paid
      }

      const updatedLoan = {
        ...currentLoan, // Preserve existing data including payments
        ...loanData,
        amount: newAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        updatedAt: Date.now(),
        // Ensure payments are preserved
        payments: currentLoan.payments || {},
        monthlyBreakdown:
          loanData.monthlyBreakdown || currentLoan.monthlyBreakdown || null,
        interestRate: loanData.interestRate || currentLoan.interestRate || 0,
        totalInterest: loanData.totalInterest || currentLoan.totalInterest || 0,
        totalAmountWithInterest:
          loanData.totalAmountWithInterest ||
          currentLoan.totalAmountWithInterest ||
          newAmount,
      };

      return await set(loanRef, updatedLoan);
    } catch (error) {
      console.error("Error updating loan:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  },

  addPayment: async (userId, loanId, paymentData) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    try {
      const paymentRef = ref(database, `loans/${userId}/${loanId}/payments`);

      // ADD validation to check if loan exists first
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const paymentKey = await push(paymentRef, {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        timestamp: paymentData.timestamp || Date.now(), // Ensure timestamp is set
      });

      return paymentKey.key;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw new Error(`Failed to add payment: ${error.message}`);
    }
  },

  // NEW: Method to update loan after payment without losing data
  updateLoanAfterPayment: async (userId, loanId, newRemainingAmount) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    try {
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      // Fix floating point precision issues
      let finalRemaining = parseFloat(newRemainingAmount) || 0;

      // Round to 2 decimal places to prevent floating point errors
      finalRemaining = Math.round(finalRemaining * 100) / 100;

      // CRITICAL FIX: If remaining is very close to zero (less than 2 centavos), set it to exactly zero
      // This handles cases where 659.95 - 659.94 = 0.009999999999990905 instead of 0.01
      if (finalRemaining < 0.02 && finalRemaining > -0.02) {
        finalRemaining = 0;
      }

      // Additional safety check: ensure it's not negative
      finalRemaining = Math.max(0, finalRemaining);

      // Determine final status based on remaining amount
      const finalStatus = finalRemaining === 0 ? "paid" : "active";

      const updates = {
        [`loans/${userId}/${loanId}/remainingAmount`]: finalRemaining,
        [`loans/${userId}/${loanId}/status`]: finalStatus,
        [`loans/${userId}/${loanId}/updatedAt`]: Date.now(),
      };

      const result = await update(ref(database), updates);

      return result;
    } catch (error) {
      console.error("Error updating loan after payment:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  },

  deleteLoan: async (userId, loanId) => {
    const loanRef = ref(database, `loans/${userId}/${loanId}`);
    return await remove(loanRef);
  },

  subscribeToLoans: (userId, callback) => {
    const loansRef = loanService.getUserLoansRef(userId);
    onValue(loansRef, callback);
    return () => off(loansRef, "value", callback);
  },

  deletePayment: async (userId, loanId, paymentId) => {
    if (!userId || !loanId || !paymentId) {
      throw new Error("User ID, Loan ID, and Payment ID are required");
    }

    try {
      const paymentRef = ref(
        database,
        `loans/${userId}/${loanId}/payments/${paymentId}`
      );

      // Get the payment data before deleting to calculate refund amount
      const paymentSnapshot = await get(paymentRef);
      if (!paymentSnapshot.exists()) {
        throw new Error("Payment not found");
      }

      const paymentData = paymentSnapshot.val();
      const refundAmount = parseFloat(paymentData.amount) || 0;

      // Delete the payment
      await remove(paymentRef);

      return { refundAmount, paymentData };
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  },

  // ADD this method to update loan after payment deletion
  updateLoanAfterPaymentDeletion: async (userId, loanId, refundAmount) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    try {
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const currentLoan = loanSnapshot.val();
      const currentRemaining = parseFloat(currentLoan.remainingAmount) || 0;
      const originalAmount = parseFloat(currentLoan.amount) || 0;

      // Add the refund amount back to remaining
      let newRemainingAmount = Math.min(
        originalAmount,
        currentRemaining + refundAmount
      );
      // Normalize to 2 decimals and zero-out tiny residuals
      newRemainingAmount = Math.round(newRemainingAmount * 100) / 100;
      if (newRemainingAmount <= 0.01) newRemainingAmount = 0;

      // Determine new status
      const newStatus =
        newRemainingAmount === originalAmount
          ? "active"
          : newRemainingAmount === 0
          ? "paid"
          : "active";

      const updates = {
        [`loans/${userId}/${loanId}/remainingAmount`]: newRemainingAmount,
        [`loans/${userId}/${loanId}/status`]: newStatus,
        [`loans/${userId}/${loanId}/updatedAt`]: Date.now(),
      };

      return await update(ref(database), updates);
    } catch (error) {
      console.error("Error updating loan after payment deletion:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  },
};

export default loanService;
