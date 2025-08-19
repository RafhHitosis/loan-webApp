export const PHILIPPINES_INTEREST_RATES = {
  monthly: 0.05, // 5% per month (common in Philippines)
  annual: 0.6, // 60% per annum
};

export const calculateMonthlyBreakdown = (
  amount,
  dueDate,
  interestRate = PHILIPPINES_INTEREST_RATES.monthly
) => {
  if (!dueDate) return null;

  const principal = parseFloat(amount);
  const startDate = new Date();
  const endDate = new Date(dueDate);
  const monthsDiff = Math.ceil(
    (endDate - startDate) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsDiff <= 0) return null;

  // Handle no interest case
  const monthlyInterest = interestRate === 0 ? 0 : principal * interestRate;
  const monthlyPrincipal = principal / monthsDiff;
  const monthlyPayment = monthlyPrincipal + monthlyInterest;

  const breakdown = [];
  let remainingPrincipal = principal;

  for (let i = 0; i < monthsDiff; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i + 1);

    const principalPayment =
      i === monthsDiff - 1 ? remainingPrincipal : monthlyPrincipal;

    breakdown.push({
      month: i + 1,
      dueDate: paymentDate.toISOString().split("T")[0],
      principalAmount: principalPayment,
      interestAmount: monthlyInterest,
      totalAmount: principalPayment + monthlyInterest,
      isPaid: false,
      paidDate: null,
      paidAmount: 0,
    });

    remainingPrincipal -= principalPayment;
  }

  return {
    monthlyBreakdown: breakdown,
    totalInterest: monthlyInterest * monthsDiff,
    totalAmount: principal + monthlyInterest * monthsDiff,
    monthlyPayment: monthlyPayment,
  };
};

export const updateBreakdownPayments = (breakdown, payments) => {
  if (!breakdown || !payments) return breakdown;

  const sortedPayments = Object.values(payments).sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  let remainingPayments = [...sortedPayments];
  const updatedBreakdown = breakdown.map((month) => ({ ...month }));

  for (let payment of remainingPayments) {
    let paymentAmount = parseFloat(payment.amount) || 0;

    // Find unpaid months in order
    for (let month of updatedBreakdown) {
      if (month.isPaid || paymentAmount <= 0) continue;

      const amountNeeded = month.totalAmount - month.paidAmount;
      const amountToApply = Math.min(paymentAmount, amountNeeded);

      month.paidAmount += amountToApply;
      paymentAmount -= amountToApply;

      if (month.paidAmount >= month.totalAmount) {
        month.isPaid = true;
        month.paidDate = new Date(payment.timestamp)
          .toISOString()
          .split("T")[0];
      }

      if (paymentAmount <= 0) break;
    }
  }

  return updatedBreakdown;
};
