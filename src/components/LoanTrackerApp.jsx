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

// Smooth scroll animation utility
const smoothScrollTo = (element, targetScrollTop, duration = 800) => {
  return new Promise((resolve) => {
    const startScrollTop = element.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      element.scrollTop = startScrollTop + distance * easeOutCubic;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animateScroll);
  });
};

// Custom hook for dynamic viewport height
const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    // Function to update viewport height
    const updateViewportHeight = () => {
      // Use the visual viewport if available (better for mobile)
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      setViewportHeight(height);

      // Update CSS custom property for dynamic viewport height
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
    };

    // Initial setup
    updateViewportHeight();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportHeight);
    } else {
      window.addEventListener("resize", updateViewportHeight);
      // Also listen for orientation changes on mobile
      window.addEventListener("orientationchange", () => {
        setTimeout(updateViewportHeight, 100);
      });
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          updateViewportHeight
        );
      } else {
        window.removeEventListener("resize", updateViewportHeight);
        window.removeEventListener("orientationchange", updateViewportHeight);
      }
    };
  }, []);

  return viewportHeight;
};

// Individual ScrollContainer component with dynamic height
const ScrollContainer = ({
  children,
  page,
  isActive,
  onScroll,
  scrollRefs,
  scrollPositions,
  viewportHeight,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      scrollRefs.current[page] = containerRef.current;
    }
  }, [page, scrollRefs]);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Restore scroll position immediately when page becomes active
      const savedPosition = scrollPositions.current[page] || 0;
      containerRef.current.scrollTop = savedPosition;
    }
  }, [isActive, page, scrollPositions]);

  const handleScroll = (e) => {
    // Save scroll position immediately as user scrolls
    scrollPositions.current[page] = e.target.scrollTop;
    if (onScroll) {
      onScroll(e);
    }
  };

  // Calculate dynamic height: viewport - header (estimated 70px) - bottom nav (estimated 70px)
  const containerHeight = Math.max(viewportHeight - 140, 300); // Minimum 300px height

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${isActive ? "block" : "hidden"}`}
      onScroll={handleScroll}
      style={{
        height: `${containerHeight}px`,
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
      }}
    >
      {children}
    </div>
  );
};

// Simplified and optimized swipe navigation hook with modal awareness
const useSwipeNavigation = (currentView, setCurrentView, isAnyModalOpen) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swipeContainerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  // Define the page order for navigation (memoized)
  const pageOrder = React.useMemo(() => ["dashboard", "loans", "profile"], []);

  const handleTouchStart = React.useCallback(
    (e) => {
      // Don't start swipe if any modal is open or already animating
      if (e.touches.length !== 1 || isAnimating || isAnyModalOpen) return;

      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    },
    [isAnimating, isAnyModalOpen]
  );

  const handleTouchEnd = React.useCallback(
    (e) => {
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
    },
    [
      isAnimating,
      isAnyModalOpen,
      currentView,
      pageOrder,
      setIsAnimating,
      setAnimationClass,
      setCurrentView,
    ]
  );

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
  }, [
    currentView,
    isAnimating,
    isAnyModalOpen,
    handleTouchStart,
    handleTouchEnd,
  ]);

  return { swipeContainerRef, isAnimating, animationClass };
};

const LoanTrackerApp = () => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [currentView, setCurrentView] = useState("dashboard");

  // Use dynamic viewport height
  const viewportHeight = useViewportHeight();

  // Updated scroll management state
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const [isDashboardScrolling, setIsDashboardScrolling] = useState(false);
  const scrollRefs = useRef({
    dashboard: null,
    loans: null,
    profile: null,
  });
  const scrollPositions = useRef({
    dashboard: 0,
    loans: 0,
    profile: 0,
  });

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
    isAnyModalOpen
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

  // Enhanced handle initial dashboard scroll with animation
  useEffect(() => {
    if (user && !hasInitialScrolled && currentView === "dashboard") {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // Add a longer delay to ensure the dashboard is fully rendered
        setTimeout(async () => {
          const dashboardContainer = scrollRefs.current.dashboard;
          if (dashboardContainer) {
            const scrollHeight = dashboardContainer.scrollHeight;
            const containerHeight = dashboardContainer.clientHeight;
            const maxScroll = scrollHeight - containerHeight;

            // Only scroll if there's content to scroll to
            if (maxScroll > 0) {
              setIsDashboardScrolling(true);

              // Animate scroll to bottom
              await smoothScrollTo(dashboardContainer, maxScroll, 1000);

              // Update stored scroll position
              scrollPositions.current.dashboard = maxScroll;
              setIsDashboardScrolling(false);
            }
          }
          setHasInitialScrolled(true);
        }, 500); // Increased delay to ensure content is loaded
      } else {
        setHasInitialScrolled(true);
      }
    }
  }, [user, hasInitialScrolled, currentView, loans.length]); // Added loans.length as dependency

  // Initialize other pages to top
  useEffect(() => {
    if (user && hasInitialScrolled) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        ["loans", "profile"].forEach((page) => {
          if (scrollPositions.current[page] === undefined) {
            scrollPositions.current[page] = 0;
          }
        });
      }
    }
  }, [user, hasInitialScrolled]);

  // Simplified handleViewChange - no manual scroll management needed
  const handleViewChange = (newView) => {
    // No need to manually save scroll position - it's handled by ScrollContainer
    setCurrentView(newView);
  };

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
    <div
      className={`${colors.background.primary}`}
      style={{
        height: `${viewportHeight}px`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Fixed height */}
      <div className="flex-shrink-0">
        <AppHeader user={user} onLogout={openLogoutConfirm} />
      </div>

      {/* Main Content Container with Swipe Navigation - Flexible height */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={swipeContainerRef}
          className={`h-full ${isAnimating ? animationClass : ""}`}
          style={{
            touchAction: "pan-y",
            overscrollBehavior: "contain",
          }}
        >
          {/* Updated main content area with ScrollContainer */}
          <div className="h-full relative">
            <ScrollContainer
              page="dashboard"
              isActive={currentView === "dashboard"}
              scrollRefs={scrollRefs}
              scrollPositions={scrollPositions}
              viewportHeight={viewportHeight}
            >
              <div className="px-5 pt-5 pb-12 space-y-5 relative">
                {/* Loading indicator for dashboard scrolling */}
                {isDashboardScrolling && (
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                    <div
                      className={`${colors.background.secondary} rounded-lg p-4 shadow-lg border ${colors.border.primary} flex items-center space-x-3`}
                    >
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className={`${colors.text.secondary} text-sm`}>
                        Loading dashboard...
                      </span>
                    </div>
                  </div>
                )}

                <Dashboard
                  loans={loans}
                  onAddLoan={() => {
                    setEditingLoan(null);
                    openLoanForm();
                  }}
                />
              </div>
            </ScrollContainer>

            <ScrollContainer
              page="loans"
              isActive={currentView === "loans"}
              scrollRefs={scrollRefs}
              scrollPositions={scrollPositions}
              viewportHeight={viewportHeight}
            >
              <div className="px-5 pt-5 pb-12 space-y-5">
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
            </ScrollContainer>

            <ScrollContainer
              page="profile"
              isActive={currentView === "profile"}
              scrollRefs={scrollRefs}
              scrollPositions={scrollPositions}
              viewportHeight={viewportHeight}
            >
              <div className="px-5 pt-5 pb-12 space-y-5">
                <Profile onModalStateChange={setProfileModalOpen} />
              </div>
            </ScrollContainer>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed height */}
      <div className="flex-shrink-0">
        <BottomNavigation
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </div>

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
