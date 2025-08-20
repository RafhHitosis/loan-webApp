export const PHILIPPINES_INTEREST_RATES = {
  monthly: 0.05, // 5% per month (common in Philippines)
  annual: 0.6, // 60% per annum
};

// Normalize a monetary value to 2 decimals and clamp tiny residuals to zero
export const normalizeAmount = (value, epsilon = 0.01) => {
  let n = Math.round((parseFloat(value) || 0) * 100) / 100;
  if (Math.abs(n) <= epsilon) n = 0;
  if (n < 0) n = 0;
  return n;
};

// Compute remaining from a breakdown + payments (fallbacks handled by callers)
export const computeRemainingFromBreakdown = (breakdown, payments) => {
  if (!Array.isArray(breakdown) || breakdown.length === 0) return null;
  const applied = updateBreakdownPayments(breakdown, payments);
  const remaining = applied.reduce((sum, m) => {
    const total = parseFloat(m.totalAmount) || 0;
    const paid = parseFloat(m.paidAmount) || 0;
    const dueLeft = Math.max(0, total - paid);
    return sum + dueLeft;
  }, 0);
  return normalizeAmount(remaining);
};

// GLoan flat add-on style calculation with precise last-payment adjustment
// If interestRate === 0: split principal equally.
// Else: totalInterest = principal * rate * months, monthly payment equalized,
//       last month adjusted to account for rounding to cents.
export const calculateMonthlyBreakdown = (
  amount,
  dueDate,
  interestRate = PHILIPPINES_INTEREST_RATES.monthly,
  startDate = null,
  processingFeeRate = 0.03 // 3% processing fee
) => {
  if (!dueDate) return null;

  const principal = parseFloat(amount);
  const loanStartDate = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(dueDate);

  // Calculate months from loan start date to due date
  const monthsDiff = Math.ceil(
    (endDate - loanStartDate) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsDiff <= 0) return null;

  // Calculate processing fee and net proceeds
  const processingFee = normalizeAmount(principal * processingFeeRate);
  const netProceeds = normalizeAmount(principal - processingFee);

  const breakdown = [];

  if (!interestRate || interestRate === 0) {
    // No interest - simple equal principal splits
    const rawMonthly = principal / monthsDiff;
    const monthlyPayment = normalizeAmount(rawMonthly);

    // Adjust last month to ensure exact principal is matched
    let accumulated = 0;
    for (let i = 0; i < monthsDiff; i++) {
      const paymentDate = new Date(loanStartDate);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);

      let thisPayment;
      if (i < monthsDiff - 1) {
        thisPayment = monthlyPayment;
        accumulated += thisPayment;
      } else {
        thisPayment = normalizeAmount(principal - accumulated);
      }

      breakdown.push({
        month: i + 1,
        dueDate: paymentDate.toISOString().split("T")[0],
        principalAmount: thisPayment,
        interestAmount: 0,
        totalAmount: thisPayment,
        isPaid: false,
        paidDate: null,
        paidAmount: 0,
        isLastPayment: i === monthsDiff - 1,
        canEarlySettle: true,
      });
    }

    return {
      monthlyBreakdown: breakdown,
      totalInterest: 0,
      totalAmount: principal,
      monthlyPayment: normalizeAmount(principal / monthsDiff),
      processingFee,
      netProceeds,
      principalPerMonth: normalizeAmount(principal / monthsDiff),
      interestPerMonth: 0,
    };
  }

  // Flat add-on interest method
  const n = monthsDiff;
  const totalInterestRaw = principal * interestRate * n;
  const totalInterest = normalizeAmount(totalInterestRaw);
  const totalAmount = normalizeAmount(principal + totalInterest);

  // Equalize monthly payments with last-month adjustment for cents
  const baseMonthly = normalizeAmount(totalAmount / n);

  // Flat monthly interest on original principal, last month adjusted for rounding
  const baseMonthlyInterest = normalizeAmount(principal * interestRate);

  let monthlyPaidAccum = 0;
  let interestAccum = 0;

  for (let i = 0; i < n; i++) {
    const paymentDate = new Date(loanStartDate);
    paymentDate.setMonth(paymentDate.getMonth() + i + 1);

    const isLast = i === n - 1;

    // Payment amount for this month
    const thisMonthPayment = isLast
      ? normalizeAmount(totalAmount - monthlyPaidAccum)
      : baseMonthly;

    // Interest for this month
    const thisMonthInterest = isLast
      ? normalizeAmount(totalInterest - interestAccum)
      : baseMonthlyInterest;

    const thisMonthPrincipal = normalizeAmount(thisMonthPayment - thisMonthInterest);

    monthlyPaidAccum += thisMonthPayment;
    interestAccum += thisMonthInterest;

    const remainingBalance = normalizeAmount(
      principal - breakdown.reduce((s, m) => s + (m.principalAmount || 0), 0) -
        thisMonthPrincipal
    );

    breakdown.push({
      month: i + 1,
      dueDate: paymentDate.toISOString().split("T")[0],
      principalAmount: thisMonthPrincipal,
      interestAmount: thisMonthInterest,
      totalAmount: thisMonthPayment,
      remainingBalance: isLast ? 0 : remainingBalance,
      isPaid: false,
      paidDate: null,
      paidAmount: 0,
      isLastPayment: isLast,
      canEarlySettle: true,
      standardPaymentAmount: baseMonthly,
      isAdjustedFinalPayment: isLast && Math.abs(thisMonthPayment - baseMonthly) > 0.01,
    });
  }

  return {
    monthlyBreakdown: breakdown,
    totalInterest: normalizeAmount(totalInterest),
    totalAmount: normalizeAmount(totalAmount),
    monthlyPayment: baseMonthly,
    processingFee,
    netProceeds,
    principalPerMonth: normalizeAmount(principal / n),
    interestPerMonth: normalizeAmount(totalInterest / n),
  };
};

// Calculate early settlement amount (approximation)
export const calculateEarlySettlement = (
  principal,
  interestRate,
  totalMonths,
  monthsPaid,
  daysIntoCurrentMonth = 0
) => {
  const principalPerMonth = principal / totalMonths;
  const remainingMonths = totalMonths - monthsPaid;
  const remainingPrincipal = principalPerMonth * remainingMonths;

  const proratedInterest = principal * interestRate * (daysIntoCurrentMonth / 30);

  return {
    remainingPrincipal: normalizeAmount(remainingPrincipal),
    proratedInterest: normalizeAmount(proratedInterest),
    totalEarlySettlement: normalizeAmount(remainingPrincipal + proratedInterest),
    savedInterest: normalizeAmount(
      (remainingMonths - 1) * principal * interestRate +
        (principal * interestRate - proratedInterest)
    ),
  };
};

export const updateBreakdownPayments = (breakdown, payments) => {
  if (!breakdown || !payments) return breakdown;

  const sortedPayments = Object.values(payments)
    .filter((p) => p && typeof p === "object")
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const updatedBreakdown = breakdown.map((month) => ({ ...month }));

  for (let payment of sortedPayments) {
    let paymentAmount = parseFloat(payment.amount) || 0;

    // Find unpaid months in order and apply with tolerance
    for (let month of updatedBreakdown) {
      if (month.isPaid || paymentAmount <= 0) continue;

      const amountNeeded = normalizeAmount(month.totalAmount - (month.paidAmount || 0));
      const amountToApply = Math.min(paymentAmount, amountNeeded);

      month.paidAmount = normalizeAmount((month.paidAmount || 0) + amountToApply);
      paymentAmount = normalizeAmount(paymentAmount - amountToApply);

      if (month.paidAmount + 0.009 >= month.totalAmount) {
        month.isPaid = true;
        month.paidAmount = normalizeAmount(month.totalAmount);
        month.paidDate = new Date(payment.timestamp || Date.now()).toISOString().split("T")[0];
      }

      if (paymentAmount <= 0.001) break;
    }
  }

  return updatedBreakdown;
};
