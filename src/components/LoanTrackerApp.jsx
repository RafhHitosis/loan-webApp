import React, { useState, useEffect } from "react";
import LoginForm from "./auth/LoginForm";
import { useAuth } from "./../contexts/AuthContext";
import Dashboard from "../components/Dashboard/Dashboard";
import ConfirmationModal from "../components/modal/ConfirmationModal";
import ManualReceiptModal from "../components/modal/ManualReceiptModal";
import ProofUploadModal from "../components/modal/ProofUploadModal";
import LoanForm from "../components/forms/LoanForm";
import LoanList from "../components/list/LoanList";
import DueDateWarning from "../components/indicators/DueDateWarning";
import Notification from "../components/notification/Notification";
import FilterSearchBar from "../components/filter/FilterSearchBar";
import AppHeader from "../components/header/AppHeader";
import BottomNavigation from "../components/navigation/BottomNavigation";
import { useTheme } from "../contexts/ThemeContext";

// Custom Hooks
import { useNotification } from "../hooks/useNotification";
import { useModalStates } from "../hooks/useModalStates";
import { useLoansData } from "../hooks/useLoansData";
import { useLoanOperations } from "../hooks/useLoanOperations";
import { useScrollOperations } from "../hooks/useScrollOperations";

const LoanTrackerApp = () => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [currentView, setCurrentView] = useState("dashboard");

  // Custom hooks
  const { notification, showNotification, clearNotification } =
    useNotification();
  const {
    showLoanForm,
    showProofUpload,
    showManualReceipt,
    showDeleteConfirm,
    showLogoutConfirm,
    openLoanForm,
    closeLoanForm,
    openProofUpload,
    closeProofUpload,
    openManualReceipt,
    closeManualReceipt,
    openDeleteConfirm,
    closeDeleteConfirm,
    openLogoutConfirm,
    closeLogoutConfirm,
  } = useModalStates();

  const {
    loans,
    filteredLoans,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
  } = useLoansData(user, showNotification);

  const {
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
  } = useLoanOperations(user, showNotification);

  const { highlightedLoanId, scrollToLoan } = useScrollOperations(
    currentView,
    setCurrentView
  );

  // Auto-scroll to bottom on app load (mobile view)
  useEffect(() => {
    if (user) {
      // Check if it's mobile view (you can adjust this breakpoint as needed)
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Small delay to ensure the DOM is fully rendered
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 300);
      }
    }
  }, [user]); // Trigger when user is loaded (app is ready)

  // Event handlers
  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    openLoanForm();
  };

  const handleUploadProof = (loan) => {
    setSelectedLoan(loan);
    openProofUpload();
  };

  const handleAddManualReceipt = (loan) => {
    setSelectedLoan(loan);
    openManualReceipt();
  };

  const initiateDelete = (loan) => {
    setLoanToDelete(loan);
    openDeleteConfirm();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showNotification("Signed out successfully!");
    } catch (error) {
      showNotification("Error signing out: " + error.message, "error");
    }
  };

  // Modal event handlers with cleanup
  const handleLoanFormClose = () => {
    closeLoanForm();
    setEditingLoan(null);
  };

  const handleProofUploadClose = () => {
    closeProofUpload();
    setSelectedLoan(null);
  };

  const handleManualReceiptClose = () => {
    closeManualReceipt();
    setSelectedLoan(null);
  };

  const handleDeleteConfirmClose = () => {
    closeDeleteConfirm();
    setLoanToDelete(null);
  };

  const handleLoanSave = async (loanData) => {
    const result = await handleSaveLoan(loanData);
    if (result.success) {
      handleLoanFormClose();
      // After adding a loan when empty, navigate to loans list
      setCurrentView("loans");
    }
  };

  const handleLoanDelete = async () => {
    if (loanToDelete?.id) {
      const result = await handleDeleteLoan(loanToDelete.id);
      if (result.success) {
        handleDeleteConfirmClose();
      }
    }
  };

  const handleProofUploadSave = async (paymentData) => {
    const result = await handleProofUpload(paymentData);
    if (result.success) {
      handleProofUploadClose();
    }
  };

  const handleManualReceiptSaveWrapper = async (receiptData) => {
    const result = await handleManualReceiptSave(receiptData);
    if (result.success) {
      handleManualReceiptClose();
    }
  };

  // Show login form if no user
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className={`min-h-screen ${colors.background.primary}`}>
      {/* Header */}
      <AppHeader user={user} onLogout={openLogoutConfirm} />

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {currentView === "dashboard" && (
          <Dashboard
            loans={loans}
            onAddLoan={() => {
              setEditingLoan(null);
              openLoanForm();
            }}
          />
        )}
        {currentView === "loans" && (
          <div className="space-y-4">
            <FilterSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFilters}
              loans={loans}
              onAddLoan={() => {
                setEditingLoan(null);
                openLoanForm();
              }}
            />
            <DueDateWarning loans={loans} onLoanClick={scrollToLoan} />
            <LoanList
              loans={filteredLoans}
              onEdit={handleEditLoan}
              onDelete={initiateDelete}
              onUploadProof={handleUploadProof}
              onAddManualReceipt={handleAddManualReceipt}
              onDeletePayment={handleDeletePayment}
              highlightedLoanId={highlightedLoanId}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Modals */}
      <LoanForm
        loan={editingLoan}
        open={showLoanForm}
        onClose={handleLoanFormClose}
        onSave={handleLoanSave}
      />

      <ProofUploadModal
        loan={selectedLoan}
        open={showProofUpload}
        onClose={handleProofUploadClose}
        onUpload={handleProofUploadSave}
      />

      <ManualReceiptModal
        loan={selectedLoan}
        open={showManualReceipt}
        onClose={handleManualReceiptClose}
        onSave={handleManualReceiptSaveWrapper}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleLoanDelete}
        title="Delete Loan"
        message={`Are you sure you want to delete the loan with ${
          loanToDelete?.personName || "this person"
        }? This action cannot be undone and will remove all payment history.`}
        confirmText="Delete Loan"
        cancelText="Keep Loan"
        type="danger"
      />

      <ConfirmationModal
        open={showLogoutConfirm}
        onClose={closeLogoutConfirm}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your loans."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        type="warning"
      />

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  );
};

export default LoanTrackerApp;
