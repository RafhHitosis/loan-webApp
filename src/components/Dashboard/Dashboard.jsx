import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  AlertTriangle,
  FileImage,
  History,
} from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import {
  computeRemainingFromBreakdown,
  normalizeAmount,
} from "../../utils/loanCalculations";
import { useTheme } from "../../contexts/ThemeContext";

const Dashboard = ({ loans, onAddLoan }) => {
  const { colors } = useTheme();

  const calculateSummary = () => {
    if (!Array.isArray(loans)) {
      return {
        totalLent: 0,
        totalBorrowed: 0,
        activeLentCount: 0,
        activeBorrowedCount: 0,
        paidLentCount: 0,
        paidBorrowedCount: 0,
        totalLentOriginal: 0,
        totalBorrowedOriginal: 0,
        totalLentPaid: 0,
        totalBorrowedPaid: 0,
        recentActivity: [],
        overdueLoans: [],
        dueSoonLoans: [],
        completionRate: 0,
      };
    }

    const lentLoans = loans.filter((loan) => loan?.type === "lent");
    const borrowedLoans = loans.filter((loan) => loan?.type === "borrowed");

    // Calculate totals
    const totalLentOriginal = lentLoans.reduce(
      (sum, loan) => sum + (parseFloat(loan?.amount) || 0),
      0
    );
    const totalBorrowedOriginal = borrowedLoans.reduce(
      (sum, loan) => sum + (parseFloat(loan?.amount) || 0),
      0
    );

    const totalLentRemaining = lentLoans.reduce((sum, loan) => {
      const recomputed = computeRemainingFromBreakdown(
        loan?.monthlyBreakdown,
        loan?.payments
      );
      const remaining = normalizeAmount(
        recomputed !== null
          ? recomputed
          : parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0
      );
      return sum + remaining;
    }, 0);

    const totalBorrowedRemaining = borrowedLoans.reduce((sum, loan) => {
      const recomputed = computeRemainingFromBreakdown(
        loan?.monthlyBreakdown,
        loan?.payments
      );
      const remaining = normalizeAmount(
        recomputed !== null
          ? recomputed
          : parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0
      );
      return sum + remaining;
    }, 0);

    const totalLentPaid = normalizeAmount(
      totalLentOriginal - totalLentRemaining
    );
    const totalBorrowedPaid = normalizeAmount(
      totalBorrowedOriginal - totalBorrowedRemaining
    );

    // Count loans by status
    const activeLentCount = lentLoans.filter(
      (loan) => loan?.status === "active"
    ).length;
    const activeBorrowedCount = borrowedLoans.filter(
      (loan) => loan?.status === "active"
    ).length;
    const paidLentCount = lentLoans.filter(
      (loan) => loan?.status === "paid"
    ).length;
    const paidBorrowedCount = borrowedLoans.filter(
      (loan) => loan?.status === "paid"
    ).length;

    // Calculate completion rate based on recomputed remaining (status-agnostic)
    const totalLoans = loans.length;
    const completedCount = loans.reduce((count, loan) => {
      const r = computeRemainingFromBreakdown(
        loan?.monthlyBreakdown,
        loan?.payments
      );
      const remaining = normalizeAmount(
        r !== null
          ? r
          : parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0
      );
      return count + (remaining === 0 ? 1 : 0);
    }, 0);
    const completionRate =
      totalLoans > 0 ? (completedCount / totalLoans) * 100 : 0;

    // Get recent activity (recent payments)
    const recentActivity = loans
      .filter((loan) => loan.payments && Object.keys(loan.payments).length > 0)
      .flatMap((loan) => {
        const payments = loan.payments || {};
        return (
          Object.entries(payments)
            .filter(([, payment]) => payment && typeof payment === "object")
            // eslint-disable-next-line no-unused-vars
            .map(([paymentId, payment]) => ({
              ...payment,
              loanId: loan.id,
              personName: loan.personName,
              loanType: loan.type,
              timestamp: payment.timestamp || Date.now(),
            }))
        );
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5); // Last 5 activities

    // Calculate overdue and due soon loans
    const now = new Date();
    const overdueLoans = [];
    const dueSoonLoans = [];

    loans.forEach((loan) => {
      if (loan.status !== "active" || !loan.dueDate) return;

      const recomputed = computeRemainingFromBreakdown(
        loan?.monthlyBreakdown,
        loan?.payments
      );
      const remainingAmount = normalizeAmount(
        recomputed !== null
          ? recomputed
          : parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0
      );
      if (remainingAmount === 0) return;

      const dueDate = new Date(loan.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        overdueLoans.push({ ...loan, daysOverdue: Math.abs(diffDays) });
      } else if (diffDays <= 7) {
        dueSoonLoans.push({ ...loan, daysLeft: diffDays });
      }
    });

    return {
      totalLent: totalLentRemaining,
      totalBorrowed: totalBorrowedRemaining,
      activeLentCount,
      activeBorrowedCount,
      paidLentCount,
      paidBorrowedCount,
      totalLentOriginal,
      totalBorrowedOriginal,
      totalLentPaid,
      totalBorrowedPaid,
      recentActivity,
      overdueLoans: overdueLoans.sort((a, b) => b.daysOverdue - a.daysOverdue),
      dueSoonLoans: dueSoonLoans.sort((a, b) => a.daysLeft - b.daysLeft),
      completionRate,
      completedCount,
      pendingCount: totalLoans - completedCount,
    };
  };

  const summary = calculateSummary();
  const netPosition = summary.totalLent - summary.totalBorrowed;
  const netOriginal = summary.totalLentOriginal - summary.totalBorrowedOriginal;

  const StatCard = ({
    title,
    amount,
    count, // eslint-disable-next-line no-unused-vars
    icon: Icon,
    gradient,
    textColor,
    subtitle,
    showProgress,
    progress,
    originalAmount,
  }) => (
    <Card
      className={`bg-gradient-to-br ${gradient} border-${
        textColor.split("-")[1]
      }-500/30`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className={`${colors.text.secondary} text-sm font-medium mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${colors.text.primary} mb-1`}>
            ₱{amount.toLocaleString()}
          </p>
          {subtitle && (
            <p className={`${colors.text.tertiary} text-xs`}>{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 bg-${
            textColor.split("-")[1]
          }-500/20 rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>

      {showProgress && originalAmount > 0 && (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className={`${colors.text.tertiary} text-xs`}>Progress</span>
            <span className={`${colors.text.tertiary} text-xs`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div
            className={`w-full ${colors.background.elevated} rounded-full h-1.5`}
          >
            <div
              className={`bg-gradient-to-r from-${
                textColor.split("-")[1]
              }-500 to-${
                textColor.split("-")[1]
              }-400 h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      <p className={`${colors.text.tertiary} text-xs`}>{count} loans</p>
    </Card>
  );

  if (loans.length === 0) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center py-16">
          <div
            className={`w-20 h-20 ${colors.background.elevated} rounded-3xl flex items-center justify-center mx-auto mb-4`}
          >
            <span className={`text-5xl ${colors.text.tertiary} font-bold`}>
              ₱
            </span>
          </div>
          <h3 className={`text-xl font-semibold ${colors.text.primary} mb-2`}>
            No loans yet
          </h3>
          <p className={`${colors.text.tertiary} text-sm mb-6`}>
            Add your first loan to start
          </p>
          <div className="flex items-center justify-center">
            <Button onClick={onAddLoan} className="px-5">
              + Add Loan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Money Lent"
          amount={summary.totalLent}
          count={`${summary.activeLentCount} active, ${summary.paidLentCount} paid`}
          icon={TrendingUp}
          gradient="from-emerald-500/10 to-emerald-600/5"
          textColor="text-emerald-400"
          subtitle={
            summary.totalLentPaid > 0
              ? `₱${summary.totalLentPaid.toLocaleString()} collected`
              : null
          }
          showProgress={summary.totalLentOriginal > 0}
          progress={
            summary.totalLentOriginal > 0
              ? (summary.totalLentPaid / summary.totalLentOriginal) * 100
              : 0
          }
          originalAmount={summary.totalLentOriginal}
        />

        <StatCard
          title="Money Borrowed"
          amount={summary.totalBorrowed}
          count={`${summary.activeBorrowedCount} active, ${summary.paidBorrowedCount} paid`}
          icon={TrendingDown}
          gradient="from-red-500/10 to-red-600/5"
          textColor="text-red-400"
          subtitle={
            summary.totalBorrowedPaid > 0
              ? `₱${summary.totalBorrowedPaid.toLocaleString()} repaid`
              : null
          }
          showProgress={summary.totalBorrowedOriginal > 0}
          progress={
            summary.totalBorrowedOriginal > 0
              ? (summary.totalBorrowedPaid / summary.totalBorrowedOriginal) *
                100
              : 0
          }
          originalAmount={summary.totalBorrowedOriginal}
        />
      </div>

      {/* Net Position & Completion Rate */}
      <div className="grid grid-cols-1 gap-4">
        <Card
          className={`${colors.background.card} ${colors.border.primary} border text-center`}
          hover={false}
        >
          <h3 className={`${colors.text.secondary} text-lg font-medium mb-4`}>
            Net Position
          </h3>
          <p
            className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              netPosition >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {netPosition >= 0 ? "+" : ""}₱
            {Math.abs(netPosition).toLocaleString()}
          </p>
          <p className={`${colors.text.tertiary} text-sm mb-3`}>
            {netPosition >= 0
              ? "You are owed more than you owe"
              : "You owe more than you are owed"}
          </p>
          {netOriginal !== netPosition && (
            <p className={`${colors.text.tertiary} text-xs`}>
              Original position: {netOriginal >= 0 ? "+" : ""}₱
              {Math.abs(netOriginal).toLocaleString()}
            </p>
          )}
        </Card>

        {/* Completion Rate */}
        {loans.length > 0 && (
          <Card
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30"
            hover={false}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-blue-400 text-lg font-medium">
                  Completion Rate
                </h3>
                <p className={`${colors.text.secondary} text-sm`}>
                  {summary.completionRate.toFixed(1)}% of loans completed
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div
              className={`w-full ${colors.background.elevated} rounded-full h-2 mb-2`}
            >
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${summary.completionRate}%` }}
              ></div>
            </div>
            <div
              className={`flex justify-between text-xs ${colors.text.tertiary}`}
            >
              <span>{summary.completedCount} completed</span>
              <span>{summary.pendingCount} pending</span>
            </div>
          </Card>
        )}
      </div>

      {/* Alerts Section */}
      {(summary.overdueLoans.length > 0 || summary.dueSoonLoans.length > 0) && (
        <Card
          className="bg-gradient-to-br from-amber-500/10 to-red-500/10 border-amber-500/30"
          hover={false}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-400 font-semibold">Attention Needed</h3>
              <p className={`${colors.text.secondary} text-sm`}>
                Some loans need your attention
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {summary.overdueLoans.slice(0, 3).map((loan, index) => (
              <div
                key={loan.id || index}
                className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20"
              >
                <div className="flex-1">
                  <p className={`${colors.text.primary} font-medium text-sm`}>
                    {loan.personName}
                  </p>
                  <p className="text-red-400 text-xs">
                    {loan.daysOverdue === 0
                      ? "Due today"
                      : `${loan.daysOverdue} days overdue`}
                  </p>
                </div>
                <p className="text-red-400 font-semibold text-sm">
                  ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                </p>
              </div>
            ))}

            {summary.dueSoonLoans.slice(0, 2).map((loan, index) => (
              <div
                key={loan.id || index}
                className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"
              >
                <div className="flex-1">
                  <p className={`${colors.text.primary} font-medium text-sm`}>
                    {loan.personName}
                  </p>
                  <p className="text-amber-400 text-xs">
                    Due in {loan.daysLeft} days
                  </p>
                </div>
                <p className="text-amber-400 font-semibold text-sm">
                  ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {summary.overdueLoans.length + summary.dueSoonLoans.length > 5 && (
            <p className={`${colors.text.tertiary} text-xs text-center mt-3`}>
              +{summary.overdueLoans.length + summary.dueSoonLoans.length - 5}{" "}
              more loans need attention
            </p>
          )}
        </Card>
      )}

      {/* Recent Activity */}
      {summary.recentActivity.length > 0 && (
        <Card className={`${colors.background.secondary}`} hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 ${colors.background.elevated} rounded-xl flex items-center justify-center`}
            >
              <History className={`w-5 h-5 ${colors.text.secondary}`} />
            </div>
            <div>
              <h3 className={`${colors.text.primary} font-semibold`}>
                Recent Activity
              </h3>
              <p className={`${colors.text.tertiary} text-sm`}>
                Latest payment activities
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {summary.recentActivity.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 ${colors.background.elevated} rounded-lg`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-md flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-xs">
                      {activity.personName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`${colors.text.primary} font-medium text-sm truncate`}
                    >
                      {activity.personName}
                    </p>
                    <p className={`${colors.text.tertiary} text-xs`}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold text-sm">
                    +₱{(activity.amount || 0).toLocaleString()}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activity.loanType === "lent"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {activity.loanType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Stats Summary */}
      {loans.length > 5 && (
        <Card
          className={`${colors.background.secondary} ${colors.border.secondary} border`}
          hover={false}
        >
          <h3
            className={`${colors.text.secondary} font-medium mb-3 text-center`}
          >
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className={`text-2xl font-bold ${colors.text.primary} mb-1`}>
                {loans.length}
              </p>
              <p className={`${colors.text.tertiary} text-sm`}>Total Loans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 mb-1">
                ₱
                {(
                  summary.totalLentOriginal + summary.totalBorrowedOriginal
                ).toLocaleString()}
              </p>
              <p className={`${colors.text.tertiary} text-sm`}>Total Value</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
