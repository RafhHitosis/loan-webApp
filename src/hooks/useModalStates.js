import { useState, useCallback } from "react";

export const useModalStates = () => {
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [showManualReceipt, setShowManualReceipt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // eslint-disable-next-line
  const openLoanForm = useCallback((editingLoan = null) => {
    setShowLoanForm(true);
  }, []);

  const closeLoanForm = useCallback(() => {
    setShowLoanForm(false);
  }, []);

  const openProofUpload = useCallback(() => {
    setShowProofUpload(true);
  }, []);

  const closeProofUpload = useCallback(() => {
    setShowProofUpload(false);
  }, []);

  const openManualReceipt = useCallback(() => {
    setShowManualReceipt(true);
  }, []);

  const closeManualReceipt = useCallback(() => {
    setShowManualReceipt(false);
  }, []);

  const openDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const openLogoutConfirm = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const closeLogoutConfirm = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  return {
    // States
    showLoanForm,
    showProofUpload,
    showManualReceipt,
    showDeleteConfirm,
    showLogoutConfirm,

    // Actions
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
  };
};
