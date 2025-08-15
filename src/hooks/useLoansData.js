import { useState, useEffect, useMemo } from "react";
import loanService from "../services/loanService";

export const useLoansData = (user, showNotification) => {
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ type: "all", status: "all" });

  // Subscribe to loans data
  useEffect(() => {
    if (!user?.uid) {
      setLoans([]);
      return;
    }

    let isSubscribed = true;

    const unsubscribe = loanService.subscribeToLoans(user.uid, (snapshot) => {
      try {
        if (!isSubscribed) return;

        const data = snapshot.val();

        if (data) {
          const loansArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          setLoans(
            loansArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          );
        } else {
          setLoans([]);
        }
      } catch (error) {
        if (isSubscribed) {
          showNotification("Error loading loans: " + error.message, "error");
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [user?.uid, showNotification]);

  // Filter loans based on search and filters
  const filteredLoans = useMemo(() => {
    let filtered = loans;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((loan) =>
        loan.personName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((loan) => loan.type === filters.type);
    }

    // Apply status filter
    if (filters.status !== "all") {
      if (filters.status === "overdue") {
        filtered = filtered.filter((loan) => {
          if (loan.status !== "active" || !loan.dueDate) return false;
          const now = new Date();
          const dueDate = new Date(loan.dueDate);
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diffDays <= 0;
        });
      } else if (filters.status === "due-soon") {
        filtered = filtered.filter((loan) => {
          if (loan.status !== "active" || !loan.dueDate) return false;
          const now = new Date();
          const dueDate = new Date(loan.dueDate);
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diffDays > 0 && diffDays <= 3;
        });
      } else {
        filtered = filtered.filter((loan) => loan.status === filters.status);
      }
    }

    return filtered;
  }, [loans, searchQuery, filters]);

  return {
    loans,
    filteredLoans,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
  };
};
