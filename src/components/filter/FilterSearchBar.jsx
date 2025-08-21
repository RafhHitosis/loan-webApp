import { useState, useMemo } from "react";
import { Plus, Search, Filter, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext"; // Update the import path

const FilterSearchBar = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  loans,
  onAddLoan,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { colors } = useTheme();

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!loans)
      return {
        all: 0,
        lent: 0,
        borrowed: 0,
        active: 0,
        paid: 0,
        overdue: 0,
        dueSoon: 0,
      };

    const now = new Date();
    let overdue = 0;
    let dueSoon = 0;

    loans.forEach((loan) => {
      if (loan.status !== "active" || !loan.dueDate) return;

      const dueDate = new Date(loan.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        overdue++;
      } else if (diffDays <= 3) {
        dueSoon++;
      }
    });

    return {
      all: loans.length,
      lent: loans.filter((loan) => loan.type === "lent").length,
      borrowed: loans.filter((loan) => loan.type === "borrowed").length,
      active: loans.filter((loan) => loan.status === "active").length,
      paid: loans.filter((loan) => loan.status === "paid").length,
      overdue,
      dueSoon,
    };
  }, [loans]);

  // Only show filter bar if there are loans
  if (!loans || loans.length === 0) {
    // Show only the Add Loan button when there are no loans
    return (
      <div className="mb-4 flex justify-end" style={{ marginTop: "-8px" }}>
        <button
          onClick={onAddLoan}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>
    );
  }

  const resetFilters = () => {
    setFilters({ type: "all", status: "all" });
    setSearchQuery("");
    setShowSearch(false);
  };

  const hasActiveFilters =
    filters.type !== "all" || filters.status !== "all" || searchQuery;

  return (
    <div className="mb-4 space-y-3" style={{ marginTop: "-8px" }}>
      {/* Top Bar with Icons and Add Button */}
      <div className="flex items-center gap-2">
        {/* Search Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            showSearch || searchQuery
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : `${colors.background.elevated} ${colors.text.tertiary} hover:${colors.text.secondary} ${colors.interactive.hover}`
          }`}
          title="Search loans"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isExpanded || hasActiveFilters
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : `${colors.background.elevated} ${colors.text.tertiary} hover:${colors.text.secondary} ${colors.interactive.hover}`
          }`}
          title="Filter loans"
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`flex items-center gap-1 px-2 py-1 ${colors.background.elevated} rounded-lg`}
            >
              <span className={`${colors.text.secondary} text-xs`}>
                Filtered
              </span>
              <button
                onClick={resetFilters}
                className={`${colors.text.tertiary} hover:${colors.text.secondary} transition-colors`}
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* ADD LOAN BUTTON - Positioned at the far right */}
        <div className="ml-auto">
          <button
            onClick={onAddLoan}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Loan</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person name..."
              className={`w-full pl-10 pr-4 py-2.5 ${colors.background.elevated} ${colors.border.primary} border rounded-xl ${colors.text.primary} placeholder:${colors.text.tertiary} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} hover:${colors.text.secondary} transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Options */}
      {isExpanded && (
        <div
          className={`animate-in slide-in-from-top-2 duration-200 space-y-3 ${colors.background.secondary} rounded-xl p-4 ${colors.border.primary} border`}
        >
          {/* Type Filter */}
          <div>
            <label
              className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
            >
              Loan Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "all", label: "All", count: filterCounts.all },
                { key: "active", label: "Active", count: filterCounts.active },
                { key: "paid", label: "Paid", count: filterCounts.paid },
                {
                  key: "overdue",
                  label: "Overdue",
                  count: filterCounts.overdue,
                  color: "red",
                },
                {
                  key: "due-soon",
                  label: "Due Soon",
                  count: filterCounts.dueSoon,
                  color: "amber",
                },
              ]
                .filter(
                  ({ key, count }) =>
                    count > 0 || ["all", "active", "paid"].includes(key)
                )
                .map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: key }))
                    }
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filters.status === key
                        ? key === "all"
                          ? `${colors.background.elevated} ${colors.text.primary}`
                          : key === "active"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : key === "paid"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : key === "overdue"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                          : key === "due-soon"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : `${colors.background.elevated} ${colors.text.primary}`
                        : `${colors.background.elevated} ${colors.text.secondary} ${colors.interactive.hover}`
                    } ${
                      color === "red" && count > 0 && key !== filters.status
                        ? "ring-1 ring-red-500/30"
                        : ""
                    }`}
                  >
                    {label} ({count})
                    {key === "overdue" && count > 0 && (
                      <span className="ml-1">⚠️</span>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
            >
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "all", label: "All", count: filterCounts.all },
                { key: "active", label: "Active", count: filterCounts.active },
                { key: "paid", label: "Paid", count: filterCounts.paid },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: key }))
                  }
                  className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filters.status === key
                      ? key === "all"
                        ? `${colors.background.elevated} ${colors.text.primary}`
                        : key === "active"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : `${colors.background.elevated} ${colors.text.secondary} ${colors.interactive.hover}`
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className={`w-full p-2 ${colors.background.elevated} ${colors.interactive.hover} ${colors.text.secondary} rounded-lg text-sm font-medium transition-colors`}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSearchBar;
