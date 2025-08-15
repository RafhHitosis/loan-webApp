const getDueDateStatus = (loan) => {
  if (!loan?.dueDate || loan.status === "paid") return null;

  const remainingAmount =
    parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
  if (remainingAmount === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(loan.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "overdue",
      days: Math.abs(diffDays),
      color: "red",
      isOverdue: true,
      isDueSoon: false,
    };
  } else if (diffDays === 0) {
    return {
      status: "due-today",
      days: 0,
      color: "red",
      isOverdue: true,
      isDueSoon: false,
    };
  } else if (diffDays <= 3) {
    return {
      status: "due-soon",
      days: diffDays,
      color: "amber",
      isOverdue: false,
      isDueSoon: true,
    };
  } else if (diffDays <= 7) {
    return {
      status: "upcoming",
      days: diffDays,
      color: "blue",
      isOverdue: false,
      isDueSoon: false,
    };
  }
  return {
    status: "normal",
    days: diffDays,
    color: "slate",
    isOverdue: false,
    isDueSoon: false,
  };
};

export default getDueDateStatus;
