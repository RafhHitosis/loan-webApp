import { useState, useCallback } from "react";

export const useNotification = () => {
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotification = useCallback((message, type = "success") => {
    // Clear any existing notification first
    setNotification({ message: "", type: "" });

    // Use requestAnimationFrame to ensure state update is processed
    requestAnimationFrame(() => {
      setNotification({ message, type });
    });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification({ message: "", type: "" });
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
};
