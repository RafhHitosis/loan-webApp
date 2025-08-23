import React, { useState, useEffect, useRef } from "react";
import LoginForm from "./auth/LoginForm";
import { useAuth } from "./../contexts/AuthContext";
import Dashboard from "../components/Dashboard/Dashboard";
import Profile from "../components/profile/Profile";
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

// Simplified and optimized swipe navigation hook with modal awareness
const useSwipeNavigation = (currentView, setCurrentView, isAnyModalOpen) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swipeContainerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  // Define the page order for navigation
  const pageOrder = ["dashboard", "loans", "profile"];

  const handleTouchStart = (e) => {
    // Don't start swipe if any modal is open or already animating
    if (e.touches.length !== 1 || isAnimating || isAnyModalOpen) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e) => {
    // Don't process swipe if any modal is open
    if (
      !touchStartX.current ||
      !touchStartY.current ||
      isAnimating ||
      isAnyModalOpen
    )
      return;
    if (e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Reset touch coordinates
    touchStartX.current = null;
    touchStartY.current = null;

    // Check if it's a valid horizontal swipe
    const minSwipeDistance = 50;
    const maxVerticalDistance = 80;

    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaY) < maxVerticalDistance &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      const currentIndex = pageOrder.indexOf(currentView);
      let targetIndex = currentIndex;

      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous page
        targetIndex = currentIndex - 1;
      } else if (deltaX < 0 && currentIndex < pageOrder.length - 1) {
        // Swipe left - go to next page
        targetIndex = currentIndex + 1;
      }

      if (targetIndex !== currentIndex) {
        setIsAnimating(true);

        // Set animation class based on swipe direction
        if (deltaX > 0) {
          // Swiped right - going to previous page
          setAnimationClass("slide-right");
        } else {
          // Swiped left - going to next page
          setAnimationClass("slide-left");
        }

        // Change view immediately
        setCurrentView(pageOrder[targetIndex]);

        // Clear animation after transition completes
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationClass("");
        }, 300);
      }
    }
  };

  useEffect(() => {
    const container = swipeContainerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentView, isAnimating, isAnyModalOpen]); // Added isAnyModalOpen to dependencies

  return { swipeContainerRef, isAnimating, animationClass };
};

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

  // State for tracking Profile component modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Check if any modal is currently open
  const isAnyModalOpen =
    showLoanForm ||
    showProofUpload ||
    showManualReceipt ||
    showDeleteConfirm ||
    showLogoutConfirm ||
    profileModalOpen;

  // Swipe navigation hook with modal awareness
  const { swipeContainerRef, isAnimating, animationClass } = useSwipeNavigation(
    currentView,
    setCurrentView,
    isAnyModalOpen // Pass modal state to hook
  );

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
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 300);
      }
    }
  }, [user]);

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
      setCurrentView("loans");

      if (loans.length === 0) {
        showNotification(
          "First loan added! You can now export comprehensive reports.",
          "success"
        );
      } else {
        showNotification(
          "Loan saved successfully! Updated data available for export.",
          "success"
        );
      }
    }
  };

  const handleLoanDelete = async () => {
    if (loanToDelete?.id) {
      const result = await handleDeleteLoan(loanToDelete.id);
      if (result.success) {
        handleDeleteConfirmClose();
        showNotification(
          "Loan deleted successfully! Export reflects current data.",
          "success"
        );
      }
    }
  };

  const handleProofUploadSave = async (paymentData) => {
    const result = await handleProofUpload(paymentData);
    if (result.success) {
      handleProofUploadClose();
      showNotification(
        "Payment recorded! Export includes updated payment history.",
        "success"
      );
    }
  };

  const handleManualReceiptSaveWrapper = async (receiptData) => {
    const result = await handleManualReceiptSave(receiptData);
    if (result.success) {
      handleManualReceiptClose();
      showNotification(
        "Payment recorded! Export includes updated payment history.",
        "success"
      );
    }
  };

  // Export success handler
  const handleExportSuccess = (fileName) => {
    showNotification(
      `PDF report "${fileName}" downloaded successfully!`,
      "success"
    );
  };

  // Export error handler
  const handleExportError = (error) => {
    showNotification(`Export failed: ${error.message}`, "error");
  };

  // Show login form if no user
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className={`min-h-screen ${colors.background.primary}`}>
      {/* Header */}
      <AppHeader user={user} onLogout={openLogoutConfirm} />

      {/* Main Content Container with Swipe Navigation */}
      <div className="relative overflow-hidden">
        <main
          ref={swipeContainerRef}
          className={`px-4 py-6 pb-24 ${isAnimating ? animationClass : ""}`}
          style={{
            touchAction: "pan-y",
            overscrollBehavior: "contain",
          }}
        >
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
                filteredLoans={filteredLoans}
                onAddLoan={() => {
                  setEditingLoan(null);
                  openLoanForm();
                }}
                onExportSuccess={handleExportSuccess}
                onExportError={handleExportError}
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

          {currentView === "profile" && (
            <Profile onModalStateChange={setProfileModalOpen} />
          )}
        </main>
      </div>

      {/* Bottom Navigation - Always visible */}
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
