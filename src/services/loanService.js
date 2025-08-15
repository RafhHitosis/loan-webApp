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
      payments: {}, // Initialize as empty object, not array
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
      const newRemainingAmount = Math.max(0, newAmount - totalPaid);

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

      console.log("Payment saved to Firebase with key:", paymentKey.key); // ADD this line
      return paymentKey.key;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw new Error(`Failed to add payment: ${error.message}`);
    }
  },

  // NEW: Method to update loan after payment without losing data
  updateLoanAfterPayment: async (
    userId,
    loanId,
    newRemainingAmount,
    newStatus
  ) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    try {
      // ADD validation to check if loan exists first
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const updates = {
        [`loans/${userId}/${loanId}/remainingAmount`]:
          parseFloat(newRemainingAmount), // Ensure it's a number
        [`loans/${userId}/${loanId}/status`]: newStatus,
        [`loans/${userId}/${loanId}/updatedAt`]: Date.now(),
      };

      console.log("Updating loan with:", updates); // ADD this line
      const result = await update(ref(database), updates);
      console.log("Update result:", result); // ADD this line

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
      const newRemainingAmount = Math.min(
        originalAmount,
        currentRemaining + refundAmount
      );

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
