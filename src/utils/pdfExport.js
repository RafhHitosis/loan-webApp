// PDF Export Utility with pastel colors, optimized spacing, and accurate data
export const loadPDFLibrary = () => {
  return new Promise((resolve, reject) => {
    if (window.jspdf) {
      resolve(window.jspdf.jsPDF);
      return;
    }

    const script1 = document.createElement("script");
    script1.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script1.onload = () => {
      const script2 = document.createElement("script");
      script2.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
      script2.onload = () => {
        if (window.jspdf) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error("jsPDF failed to load"));
        }
      };
      script2.onerror = () =>
        reject(new Error("Failed to load jsPDF AutoTable"));
      document.head.appendChild(script2);
    };
    script1.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(script1);
  });
};

// Helper function to normalize amounts and prevent floating point issues
const normalizeAmount = (value, epsilon = 0.01) => {
  let n = Math.round((parseFloat(value) || 0) * 100) / 100;
  if (Math.abs(n) <= epsilon) n = 0;
  if (n < 0) n = 0;
  return n;
};

// Helper function to detect payment method from payment data
const getPaymentMethod = (payment) => {
  if (!payment || typeof payment !== "object") return "unknown";

  // Check if payment has proof URL (digital payment)
  if (payment.proofUrl && payment.proofPublicId) {
    return "digital";
  }

  // Check if payment is marked as manual or has manual receipt fields
  if (payment.type === "manual" || payment.receiptId || payment.paymentMethod) {
    return "manual";
  }

  // Fallback - if it has timestamp but no proof, likely manual
  if (payment.timestamp && !payment.proofUrl) {
    return "manual";
  }

  return "unknown";
};

// Helper function to get payment method display name
const getPaymentMethodDisplay = (method) => {
  switch (method) {
    case "digital":
      return "Digital (w/ Receipt)";
    case "manual":
      return "Manual Entry";
    case "unknown":
    default:
      return "Unknown";
  }
};

// Helper function to update breakdown with payments (similar to your loan calculations)
const updateBreakdownPayments = (breakdown, payments) => {
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

      const amountNeeded = normalizeAmount(
        month.totalAmount - (month.paidAmount || 0)
      );
      const amountToApply = Math.min(paymentAmount, amountNeeded);

      month.paidAmount = normalizeAmount(
        (month.paidAmount || 0) + amountToApply
      );
      paymentAmount = normalizeAmount(paymentAmount - amountToApply);

      // Mark as paid if amount is close enough (within 1 centavo tolerance)
      if (month.paidAmount + 0.009 >= month.totalAmount) {
        month.isPaid = true;
        month.paidAmount = normalizeAmount(month.totalAmount);
        month.paidDate = new Date(payment.timestamp || Date.now())
          .toISOString()
          .split("T")[0];
      }

      if (paymentAmount <= 0.001) break;
    }
  }

  return updatedBreakdown;
};

// Helper function to compute remaining from breakdown + payments
const computeRemainingFromBreakdown = (breakdown, payments) => {
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

// Helper function to calculate accurate remaining amount for a loan
const calculateAccurateRemainingAmount = (loan) => {
  // If loan has monthly breakdown, calculate from that
  if (
    Array.isArray(loan.monthlyBreakdown) &&
    loan.monthlyBreakdown.length > 0
  ) {
    const breakdownRemaining = computeRemainingFromBreakdown(
      loan.monthlyBreakdown,
      loan.payments
    );
    if (breakdownRemaining !== null) {
      return breakdownRemaining;
    }
  }

  // Fallback to simple calculation
  const originalAmount = parseFloat(loan.amount) || 0;
  const totalPaid = Object.values(loan.payments || {})
    .filter((p) => p && typeof p === "object")
    .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

  let remaining = originalAmount - totalPaid;

  // Handle floating point precision and near-zero amounts
  remaining = normalizeAmount(remaining);

  return remaining;
};

// Helper function to determine actual loan status
const getActualLoanStatus = (loan) => {
  const remainingAmount = calculateAccurateRemainingAmount(loan);

  // If remaining is effectively zero, it's paid
  if (remainingAmount <= 0.01) {
    return "paid";
  }

  // If has breakdown, check if all installments are paid
  if (
    Array.isArray(loan.monthlyBreakdown) &&
    loan.monthlyBreakdown.length > 0
  ) {
    const updatedBreakdown = updateBreakdownPayments(
      loan.monthlyBreakdown,
      loan.payments
    );
    const allPaid = updatedBreakdown.every((month) => month.isPaid);
    if (allPaid) {
      return "paid";
    }
  }

  // Otherwise, use stored status or default to active
  return loan.status || "active";
};

export const exportLoansToPDF = async (loans, isDarkMode, user) => {
  try {
    const jsPDF = await loadPDFLibrary();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15; // Reduced from 20

    // Pastel color scheme - lighter and more pleasant
    const colors = isDarkMode
      ? {
          primary: [88, 101, 142], // Soft navy blue
          secondary: [108, 117, 125], // Soft gray
          accent: [107, 203, 119], // Soft mint green
          text: [248, 249, 250], // Very light gray
          lightText: [173, 181, 189], // Light gray
          background: [52, 58, 64], // Soft dark gray
          cardBg: [73, 80, 87], // Medium gray
          danger: [248, 144, 144], // Pastel red
          warning: [255, 193, 119], // Pastel orange
        }
      : {
          primary: [147, 167, 209], // Soft periwinkle
          secondary: [173, 181, 189], // Light gray
          accent: [144, 238, 144], // Light green
          text: [73, 80, 87], // Dark gray
          lightText: [134, 142, 150], // Medium gray
          background: [248, 249, 250], // Very light gray
          cardBg: [233, 236, 239], // Light blue-gray
          danger: [255, 182, 193], // Light pink
          warning: [255, 218, 185], // Light peach
        };

    let yPosition = 25; // Reduced from 30

    // Helper function to format peso amounts properly
    const formatPeso = (amount) => {
      const numAmount = parseFloat(amount || 0);
      return `PHP ${numAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    // Centered title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    const titleText = "Loan Tracker Report";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 17);

    // Centered date and user info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateText = `Generated: ${currentDate}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, 26);

    if (user?.email) {
      const userText = `User: ${user.email}`;
      const userWidth = doc.getTextWidth(userText);
      doc.text(userText, (pageWidth - userWidth) / 2, 31);
    }

    yPosition = 55;

    doc.setTextColor(...colors.text);
    doc.setFillColor(95, 203, 100);
    doc.rect(margin - 3, yPosition - 8, pageWidth - 2 * margin + 6, 12, "F"); // Reduced height

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); // Reduced from 16
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", margin, yPosition);
    yPosition += 15; // Reduced from 20

    // Calculate enhanced summary from actual loan data with accurate status detection
    const totalLoans = loans.length;

    // Use accurate status calculation
    const loansWithAccurateStatus = loans.map((loan) => ({
      ...loan,
      actualStatus: getActualLoanStatus(loan),
      actualRemainingAmount: calculateAccurateRemainingAmount(loan),
    }));

    const activeLoans = loansWithAccurateStatus.filter(
      (loan) => loan.actualStatus === "active"
    ).length;
    const paidLoans = loansWithAccurateStatus.filter(
      (loan) => loan.actualStatus === "paid"
    ).length;
    const lentLoans = loansWithAccurateStatus.filter(
      (loan) => loan.type === "lent"
    );
    const borrowedLoans = loansWithAccurateStatus.filter(
      (loan) => loan.type === "borrowed"
    );

    const totalLent = lentLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.amount || 0),
      0
    );
    const totalBorrowed = borrowedLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.amount || 0),
      0
    );

    // Calculate accurate outstanding and paid amounts
    const totalOutstanding = loansWithAccurateStatus.reduce((sum, loan) => {
      return sum + loan.actualRemainingAmount;
    }, 0);

    const totalPaid = loansWithAccurateStatus.reduce((sum, loan) => {
      const original = parseFloat(loan.amount || 0);
      const remaining = loan.actualRemainingAmount;
      const paid = Math.max(0, original - remaining);
      return sum + paid;
    }, 0);

    // Enhanced payment method analytics with interest calculations
    let totalPayments = 0;
    let digitalPayments = 0;
    let manualPayments = 0;
    let totalDigitalAmount = 0;
    let totalManualAmount = 0;
    let totalInterestEarned = 0; // For lent loans
    let totalInterestOwed = 0; // For borrowed loans
    let loansWithInterest = 0;

    loansWithAccurateStatus.forEach((loan) => {
      // Calculate interest from monthly breakdown if available
      if (
        loan.monthlyBreakdown &&
        Array.isArray(loan.monthlyBreakdown) &&
        loan.monthlyBreakdown.length > 0
      ) {
        const totalInterest = loan.monthlyBreakdown.reduce(
          (sum, month) => sum + (parseFloat(month.interestAmount) || 0),
          0
        );

        if (totalInterest > 0) {
          loansWithInterest++;
          if (loan.type === "lent") {
            totalInterestEarned += totalInterest;
          } else if (loan.type === "borrowed") {
            totalInterestOwed += totalInterest;
          }
        }
      }

      // Process payments
      if (loan.payments && typeof loan.payments === "object") {
        Object.values(loan.payments).forEach((payment) => {
          if (payment && typeof payment === "object") {
            totalPayments++;
            const paymentAmount = parseFloat(payment.amount) || 0;
            const method = getPaymentMethod(payment);

            if (method === "digital") {
              digitalPayments++;
              totalDigitalAmount += paymentAmount;
            } else if (method === "manual") {
              manualPayments++;
              totalManualAmount += paymentAmount;
            }
          }
        });
      }
    });

    // Summary table data - only actual data with enhanced metrics
    const summaryData = [
      ["Total Loans", totalLoans.toString()],
      [
        "Active Loans",
        `${activeLoans} (${
          totalLoans > 0 ? ((activeLoans / totalLoans) * 100).toFixed(1) : 0
        }%)`,
      ],
      [
        "Paid Loans",
        `${paidLoans} (${
          totalLoans > 0 ? ((paidLoans / totalLoans) * 100).toFixed(1) : 0
        }%)`,
      ],
    ];

    // Add financial data only if there are lent/borrowed loans
    if (lentLoans.length > 0) {
      summaryData.push(["Money Lent", formatPeso(totalLent)]);
    }
    if (borrowedLoans.length > 0) {
      summaryData.push(["Money Borrowed", formatPeso(totalBorrowed)]);
    }
    if (totalOutstanding > 0) {
      summaryData.push(["Total Outstanding", formatPeso(totalOutstanding)]);
    }
    if (totalPaid > 0) {
      summaryData.push(["Total Paid", formatPeso(totalPaid)]);
    }
    if (lentLoans.length > 0 && borrowedLoans.length > 0) {
      summaryData.push(["Net Position", formatPeso(totalLent - totalBorrowed)]);
    }

    // Add interest analytics if there are loans with interest
    if (loansWithInterest > 0) {
      summaryData.push(["", ""]); // Separator
      summaryData.push(["Interest Analytics", ""]); // Header
      summaryData.push([
        "Loans with Interest",
        `${loansWithInterest} of ${totalLoans}`,
      ]);

      if (totalInterestEarned > 0) {
        summaryData.push(["Interest Earned", formatPeso(totalInterestEarned)]);
      }

      if (totalInterestOwed > 0) {
        summaryData.push(["Interest Owed", formatPeso(totalInterestOwed)]);
      }

      if (totalInterestEarned > 0 && totalInterestOwed > 0) {
        summaryData.push([
          "Net Interest",
          formatPeso(totalInterestEarned - totalInterestOwed),
        ]);
      }
    }

    // Add payment method analytics if there are payments
    if (totalPayments > 0) {
      summaryData.push(["", ""]); // Separator
      summaryData.push(["Payment Analytics", ""]); // Header
      summaryData.push(["Total Payments Made", totalPayments.toString()]);

      if (digitalPayments > 0) {
        summaryData.push([
          "Digital Payments",
          `${digitalPayments} (${(
            (digitalPayments / totalPayments) *
            100
          ).toFixed(1)}%)`,
        ]);
        summaryData.push(["Digital Amount", formatPeso(totalDigitalAmount)]);
      }

      if (manualPayments > 0) {
        summaryData.push([
          "Manual Payments",
          `${manualPayments} (${(
            (manualPayments / totalPayments) *
            100
          ).toFixed(1)}%)`,
        ]);
        summaryData.push(["Manual Amount", formatPeso(totalManualAmount)]);
      }

      // Payment method preference
      const preferredMethod =
        digitalPayments > manualPayments
          ? "Digital"
          : manualPayments > digitalPayments
          ? "Manual"
          : "Balanced";
      summaryData.push(["Preferred Method", preferredMethod]);
    }

    // Create compact summary table
    doc.autoTable({
      startY: yPosition,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [95, 203, 100],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9, // Reduced from 10
      },
      bodyStyles: {
        fillColor: colors.cardBg,
        textColor: colors.text,
        fontSize: 8, // Reduced from 9
        cellPadding: 2, // Reduced padding
      },
      alternateRowStyles: {
        fillColor: colors.background,
      },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 }, // Fixed width for metric column
        1: { cellWidth: "auto" }, // Auto width for value column
      },
      didParseCell: (data) => {
        // Style section headers and separators
        if (
          data.cell.raw === "Payment Analytics" ||
          data.cell.raw === "Interest Analytics" ||
          data.cell.raw === ""
        ) {
          if (
            data.cell.raw === "Payment Analytics" ||
            data.cell.raw === "Interest Analytics"
          ) {
            data.cell.styles.fillColor = [95, 203, 100];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [0, 0, 0, 0]; // Transparent
            data.cell.styles.textColor = [0, 0, 0, 0]; // Transparent text
          }
        }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 20; // Reduced from 30

    // Compact Due Date Alerts
    const loansWithDueDates = loansWithAccurateStatus.filter(
      (loan) => loan.dueDate && loan.actualStatus === "active"
    );
    const overdueLoans = loansWithDueDates.filter((loan) => {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      return dueDate < today;
    });

    const dueSoonLoans = loansWithDueDates.filter((loan) => {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    if (overdueLoans.length > 0 || dueSoonLoans.length > 0) {
      // Check if we need a new page with footer buffer
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 25;
      }

      doc.setFillColor(...colors.danger);
      doc.rect(margin - 3, yPosition - 8, pageWidth - 2 * margin + 6, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12); // Reduced from 14
      doc.setFont("helvetica", "bold");
      doc.text("⚠ Attention Required", margin, yPosition);
      yPosition += 15; // Reduced from 20

      if (overdueLoans.length > 0) {
        doc.setTextColor(...colors.danger);
        doc.setFontSize(10); // Reduced from 12
        doc.text(
          `${overdueLoans.length} Overdue Loan${
            overdueLoans.length > 1 ? "s" : ""
          }:`,
          margin,
          yPosition
        );
        yPosition += 8; // Reduced from 10

        overdueLoans.forEach((loan) => {
          doc.setTextColor(...colors.text);
          doc.setFontSize(8); // Reduced from 10
          const daysOverdue = Math.floor(
            (new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24)
          );
          doc.text(
            `• ${loan.personName} - ${daysOverdue} days overdue (${formatPeso(
              loan.actualRemainingAmount
            )})`,
            margin + 3,
            yPosition
          );
          yPosition += 6; // Reduced from 8
        });
        yPosition += 3; // Reduced from 5
      }

      if (dueSoonLoans.length > 0) {
        doc.setTextColor(...colors.warning);
        doc.setFontSize(10); // Reduced from 12
        doc.text(`${dueSoonLoans.length} Due Soon:`, margin, yPosition);
        yPosition += 8; // Reduced from 10

        dueSoonLoans.forEach((loan) => {
          doc.setTextColor(...colors.text);
          doc.setFontSize(8); // Reduced from 10
          const daysUntilDue = Math.ceil(
            (new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
          );
          doc.text(
            `• ${loan.personName} - Due in ${daysUntilDue} day${
              daysUntilDue > 1 ? "s" : ""
            } (${formatPeso(loan.actualRemainingAmount)})`,
            margin + 3,
            yPosition
          );
          yPosition += 6; // Reduced from 8
        });
      }
      yPosition += 15; // Reduced from 20
    }

    // Individual Loan Details Section with compact layout
    loansWithAccurateStatus.forEach((loan, index) => {
      // Check if we need a new page with more space for footer (30px buffer instead of 40)
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 25;
      }

      // Compact loan header
      doc.setFillColor(80, 80, 80);
      doc.rect(
        margin - 3,
        yPosition - 8,
        pageWidth - 2 * margin + 6,
        18, // Reduced from 25
        "F"
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12); // Reduced from 14
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${loan.personName}`, margin, yPosition);

      // Status badge - use accurate status
      const statusColor =
        loan.actualStatus === "active" ? colors.warning : [95, 203, 100];
      doc.setTextColor(...statusColor);
      doc.setFontSize(10); // Reduced from 12
      const statusText = `[${loan.actualStatus?.toUpperCase() || "UNKNOWN"}]`;
      const statusWidth = doc.getTextWidth(statusText);
      doc.text(statusText, pageWidth - margin - statusWidth, yPosition);

      // Loan type - more compact
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8); // Reduced from 10
      const typeText =
        loan.type === "lent"
          ? "Money Lent"
          : loan.type === "borrowed"
          ? "Money Borrowed"
          : "Unknown Type";
      doc.text(typeText, margin, yPosition + 6); // Reduced from 8

      yPosition += 22; // Reduced from 30

      // Calculate loan financials from accurate data
      const originalAmount = parseFloat(loan.amount || 0);
      const remainingAmount = loan.actualRemainingAmount;
      const totalPaid = Math.max(0, originalAmount - remainingAmount);
      const progressPercentage =
        originalAmount > 0 ? (totalPaid / originalAmount) * 100 : 0;

      // Build loan info array from actual data only
      const loanInfo = [
        ["Person Name", loan.personName || "Unknown"],
        ["Original Amount", formatPeso(originalAmount)],
      ];

      if (totalPaid > 0) {
        loanInfo.push(["Amount Paid", formatPeso(totalPaid)]);
      }

      if (remainingAmount !== originalAmount) {
        loanInfo.push(["Remaining Amount", formatPeso(remainingAmount)]);
        loanInfo.push(["Progress", `${progressPercentage.toFixed(1)}%`]);
      }

      // Add interest information if available
      if (
        loan.monthlyBreakdown &&
        Array.isArray(loan.monthlyBreakdown) &&
        loan.monthlyBreakdown.length > 0
      ) {
        const breakdown = loan.monthlyBreakdown;
        const totalInterest = breakdown.reduce(
          (sum, month) => sum + (parseFloat(month.interestAmount) || 0),
          0
        );
        const totalAmount = breakdown.reduce(
          (sum, month) => sum + (parseFloat(month.totalAmount) || 0),
          0
        );

        if (totalInterest > 0) {
          loanInfo.push(["Total Interest", formatPeso(totalInterest)]);
          loanInfo.push(["Total w/ Interest", formatPeso(totalAmount)]);

          // Try to get the original interest rate from loan data first
          let monthlyInterestRate = null;

          // Check if loan has stored interest rate (stored as decimal, convert to percentage)
          if (loan.interestRate !== undefined && loan.interestRate !== null) {
            monthlyInterestRate = parseFloat(loan.interestRate) * 100; // Convert 0.0359 to 3.59
          } else if (
            loan.monthlyInterestRate !== undefined &&
            loan.monthlyInterestRate !== null
          ) {
            monthlyInterestRate = parseFloat(loan.monthlyInterestRate) * 100;
          } else {
            // Fallback: Calculate from breakdown data
            // For flat add-on method: each month should have same interest amount
            const monthlyInterest =
              parseFloat(breakdown[0]?.interestAmount) || 0;
            monthlyInterestRate =
              originalAmount > 0 ? (monthlyInterest / originalAmount) * 100 : 0;
          }

          if (monthlyInterestRate > 0) {
            loanInfo.push([
              "Monthly Interest Rate",
              `${monthlyInterestRate.toFixed(2)}%`,
            ]);

            // Also show annual equivalent
            const annualRate = monthlyInterestRate * 12;
            loanInfo.push([
              "Annual Interest Rate",
              `${annualRate.toFixed(2)}%`,
            ]);
          }
        }
      } else if (
        loan.interestRate !== undefined &&
        loan.interestRate !== null
      ) {
        // Show interest rate even if no breakdown exists (convert from decimal to percentage)
        const monthlyRate = parseFloat(loan.interestRate) * 100; // Convert 0.0359 to 3.59

        if (monthlyRate > 0) {
          loanInfo.push([
            "Monthly Interest Rate",
            `${monthlyRate.toFixed(2)}%`,
          ]);
          loanInfo.push([
            "Annual Interest Rate",
            `${(monthlyRate * 12).toFixed(2)}%`,
          ]);
        }
      } else if (
        loan.monthlyInterestRate !== undefined &&
        loan.monthlyInterestRate !== null
      ) {
        // Alternative field name
        const monthlyRate = parseFloat(loan.monthlyInterestRate) * 100;

        if (monthlyRate > 0) {
          loanInfo.push([
            "Monthly Interest Rate",
            `${monthlyRate.toFixed(2)}%`,
          ]);
          loanInfo.push([
            "Annual Interest Rate",
            `${(monthlyRate * 12).toFixed(2)}%`,
          ]);
        }
      }

      if (loan.date) {
        loanInfo.push([
          "Created Date",
          new Date(loan.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        ]);
      }

      if (loan.dueDate) {
        loanInfo.push([
          "Due Date",
          new Date(loan.dueDate).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        ]);
      }

      if (loan.description && loan.description.trim()) {
        loanInfo.push(["Description", loan.description.trim()]);
      }

      // Compact loan info table
      doc.autoTable({
        startY: yPosition,
        body: loanInfo,
        theme: "plain",
        bodyStyles: {
          textColor: colors.text,
          fontSize: 8, // Reduced from 9
          cellPadding: 1.5, // Reduced padding
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: colors.cardBg,
            cellWidth: 35, // Reduced from 40
          },
          1: {
            fillColor: colors.background,
          },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = doc.lastAutoTable.finalY + 10; // Reduced from 15

      // Compact Monthly Breakdown Section
      if (
        loan.monthlyBreakdown &&
        Array.isArray(loan.monthlyBreakdown) &&
        loan.monthlyBreakdown.length > 0
      ) {
        // Check if we need a new page with footer buffer
        if (yPosition > pageHeight - 90) {
          doc.addPage();
          yPosition = 25;
        }

        doc.setTextColor(...colors.text);
        doc.setFontSize(10); // Reduced from 12
        doc.setFont("helvetica", "bold");
        doc.text("Monthly Payment Breakdown:", margin, yPosition);
        yPosition += 5; // Reduced from 12

        // Update breakdown with payments to show accurate status
        const updatedBreakdown = updateBreakdownPayments(
          loan.monthlyBreakdown,
          loan.payments
        );

        const breakdownData = updatedBreakdown.map((month, idx) => {
          const dueDate = month.dueDate
            ? new Date(month.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Not set";

          const principal = formatPeso(month.principalAmount || 0);
          const interest = formatPeso(month.interestAmount || 0);
          const total = formatPeso(month.totalAmount || 0);
          const paid = formatPeso(month.paidAmount || 0);
          const status = month.isPaid ? "PAID" : "PENDING";

          return [
            `Month ${idx + 1}`,
            dueDate,
            principal,
            interest,
            total,
            paid,
            status,
          ];
        });

        doc.autoTable({
          startY: yPosition,
          head: [
            [
              "Period",
              "Due Date",
              "Principal",
              "Interest",
              "Total",
              "Paid",
              "Status",
            ],
          ],
          body: breakdownData,
          theme: "striped",
          headStyles: {
            fillColor: [95, 203, 100],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: "bold",
            cellPadding: { top: 2, right: 0.8, bottom: 2, left: 0.8 },
            halign: "center",
          },
          bodyStyles: {
            textColor: colors.text,
            fontSize: 6,
            cellPadding: { top: 2, right: 0.8, bottom: 2, left: 0.8 },
            halign: "center",
            minCellHeight: 5,
          },
          alternateRowStyles: {
            fillColor: colors.cardBg,
          },
          columnStyles: {
            "*": { cellWidth: "auto" },
          },
          margin: { left: 18, right: 18 },
          tableWidth: "auto",
          horizontalPageBreak: true,
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Compact Payment History Section
      if (
        loan.payments &&
        typeof loan.payments === "object" &&
        Object.keys(loan.payments).length > 0
      ) {
        // Check if we need a new page with footer buffer
        if (yPosition > pageHeight - 70) {
          doc.addPage();
          yPosition = 25;
        }

        doc.setTextColor(...colors.text);
        doc.setFontSize(10); // Reduced from 12
        doc.setFont("helvetica", "bold");
        doc.text("Payment History:", margin, yPosition);
        yPosition += 5;

        const payments = Object.values(loan.payments)
          .filter((payment) => payment && typeof payment === "object")
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const paymentData = payments.map((payment) => {
          const date = payment.timestamp
            ? new Date(payment.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown";

          const time = payment.timestamp
            ? new Date(payment.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unknown";

          const amount = formatPeso(payment.amount || 0);
          const paymentMethod = getPaymentMethodDisplay(
            getPaymentMethod(payment)
          );
          const description = payment.description || "No description";
          const hasProof = payment.proofUrl ? "Yes" : "No";

          return [date, time, amount, paymentMethod, description, hasProof];
        });

        doc.autoTable({
          startY: yPosition,
          head: [["Date", "Time", "Amount", "Method", "Description", "Proof"]],
          body: paymentData,
          theme: "striped",
          headStyles: {
            fillColor: [95, 203, 100],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: "bold",
            cellPadding: { top: 2, right: 0.8, bottom: 2, left: 0.8 },
            halign: "center",
          },
          bodyStyles: {
            textColor: colors.text,
            fontSize: 6,
            cellPadding: { top: 2, right: 0.8, bottom: 2, left: 0.8 },
            halign: "center",
            minCellHeight: 5,
          },
          alternateRowStyles: {
            fillColor: colors.cardBg,
          },
          columnStyles: {
            "*": { cellWidth: "auto" },
          },
          margin: { left: 18, right: 18 },
          tableWidth: "auto",
          horizontalPageBreak: true,
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Add compact separator between loans (except for last loan)
      // Enhanced separator between loans
      if (index < loans.length - 1) {
        // Check if we need a new page before adding separator
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 25;
        } else {
          // Add decorative separator
          doc.setFillColor(95, 203, 100);
          doc.rect(margin, yPosition + 5, pageWidth - 2 * margin, 1, "F");

          // Add loan number indicator for next loan
          doc.setTextColor(...colors.lightText);
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          const nextLoanText = `── End of Loan ${index + 1} ──`;
          const textWidth = doc.getTextWidth(nextLoanText);
          doc.text(nextLoanText, (pageWidth - textWidth) / 2, yPosition + 12);

          yPosition += 35;
        }
      }
    });

    // Add page numbers and compact footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Compact footer text
      doc.setFontSize(7); // Reduced from 8
      doc.setFont("helvetica", "normal");

      const footerText = `Loan Tracker Report | Page ${i} of ${pageCount} | Generated ${currentDate}`;
      const textWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 6); // Adjusted position
    }

    // Generate filename and save
    const fileName = `loan-tracker-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
