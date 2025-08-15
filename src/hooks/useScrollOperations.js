import { useState, useCallback } from "react";

export const useScrollOperations = (currentView, setCurrentView) => {
  const [highlightedLoanId, setHighlightedLoanId] = useState(null);

  const scrollToLoan = useCallback(
    (loanId) => {
      if (!loanId) return;

      // Ensure we're on the loans view first
      if (currentView !== "loans") {
        setCurrentView("loans");
        // Wait for view to switch before scrolling
        setTimeout(() => {
          attemptScroll(loanId);
        }, 300);
      } else {
        attemptScroll(loanId);
      }
    },
    //eslint-disable-next-line
    [currentView, setCurrentView]
  );

  const attemptScroll = useCallback((loanId) => {
    // Add delay to ensure DOM is fully rendered
    setTimeout(() => {
      let loanElement = document.querySelector(`[data-loan-id="${loanId}"]`);

      // Try with string conversion if not found
      if (!loanElement) {
        loanElement = document.querySelector(`[data-loan-id='${loanId}']`);
      }

      if (loanElement) {
        loanElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Highlight the loan
        setHighlightedLoanId(loanId);
        // Remove highlight after animation
        setTimeout(() => setHighlightedLoanId(null), 2000);
      } else {
        // Fallback: scroll to top of loans list
        const loansContainer = document.querySelector("[data-loans-container]");
        if (loansContainer) {
          loansContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    }, 100);
  }, []);

  return {
    highlightedLoanId,
    scrollToLoan,
  };
};
