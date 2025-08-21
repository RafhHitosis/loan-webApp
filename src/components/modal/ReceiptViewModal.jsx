import { useTheme } from "../../contexts/ThemeContext";

const ReceiptViewModal = ({ payment, loan, open, onClose }) => {
  const { colors, isDarkMode } = useTheme();

  if (!open || !payment) return null;

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const { date, time } = formatDateTime(payment.timestamp);

  // Theme-aware styles for receipt-specific elements
  const receiptBodyClasses = isDarkMode
    ? "bg-slate-800 text-slate-100"
    : "bg-white text-slate-800";
  const receiptHeaderClasses = isDarkMode
    ? "bg-slate-900 text-white"
    : "bg-slate-800 text-white"; // Keep header dark in both themes for contrast
  const amountTextClasses = isDarkMode ? "text-slate-100" : "text-slate-800";
  const labelTextClasses = isDarkMode ? "text-slate-400" : "text-slate-600";
  const valueTextClasses = isDarkMode ? "text-slate-200" : "text-slate-800";
  const borderClasses = isDarkMode ? "border-slate-600" : "border-slate-200";
  const notesBackgroundClasses = isDarkMode ? "bg-slate-700/50" : "bg-slate-50";
  const footerClasses = isDarkMode ? "bg-slate-700/30" : "bg-slate-50";
  const buttonClasses = isDarkMode
    ? "bg-slate-600 hover:bg-slate-500 text-white"
    : "bg-slate-800 hover:bg-slate-700 text-white";

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200 pt-5 pb-5 px-4">
        <div
          className={`w-full max-w-sm ${receiptBodyClasses} rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-full mx-auto overflow-hidden`}
        >
          {/* Receipt Header */}
          <div
            className={`${receiptHeaderClasses} p-4 text-center rounded-t-2xl flex-shrink-0 relative`}
          >
            <h2 className="text-lg font-bold mb-1">Payment Receipt</h2>
            <p
              className={`${
                isDarkMode ? "text-slate-300" : "text-slate-300"
              } text-sm`}
            >
              Personal Transaction
            </p>
            <div
              className={`mt-2 text-xs ${
                isDarkMode ? "text-slate-400" : "text-slate-400"
              } font-mono`}
            >
              #{payment.receiptId}
            </div>
          </div>

          {/* Receipt Body - Scrollable */}
          <div
            className={`p-4 ${receiptBodyClasses} space-y-3 overflow-y-auto flex-1`}
          >
            {/* Amount */}
            <div className={`text-center border-b ${borderClasses} pb-3`}>
              <p className={`${labelTextClasses} text-sm mb-1`}>Amount Paid</p>
              <p className={`text-2xl font-bold ${amountTextClasses}`}>
                ₱{payment.amount.toLocaleString()}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={labelTextClasses}>Date:</span>
                <span className={`font-medium text-right ${valueTextClasses}`}>
                  {date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={labelTextClasses}>Time:</span>
                <span className={`font-medium ${valueTextClasses}`}>
                  {time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={labelTextClasses}>Method:</span>
                <span className={`font-medium capitalize ${valueTextClasses}`}>
                  {payment.paymentMethod?.replace("_", " ") || "Cash"}
                </span>
              </div>
              {payment.location && (
                <div className="flex justify-between items-start">
                  <span className={`${labelTextClasses} flex-shrink-0`}>
                    Location:
                  </span>
                  <span
                    className={`font-medium text-right ml-2 break-words ${valueTextClasses}`}
                  >
                    {payment.location}
                  </span>
                </div>
              )}
            </div>

            {/* Parties */}
            {loan && (
              <div
                className={`border-t ${borderClasses} pt-3 space-y-2 text-sm`}
              >
                <div className="flex justify-between items-start">
                  <span className={`${labelTextClasses} flex-shrink-0`}>
                    {loan.type === "lent" ? "Borrower:" : "Lender:"}
                  </span>
                  <span
                    className={`font-medium text-right ml-2 break-words ${valueTextClasses}`}
                  >
                    {loan.personName}
                  </span>
                </div>
                {payment.witnessName && (
                  <div className="flex justify-between items-start">
                    <span className={`${labelTextClasses} flex-shrink-0`}>
                      Witness:
                    </span>
                    <span
                      className={`font-medium text-right ml-2 break-words ${valueTextClasses}`}
                    >
                      {payment.witnessName}
                    </span>
                  </div>
                )}
                {payment.witnessContact && (
                  <div className="flex justify-between items-start">
                    <span className={`${labelTextClasses} flex-shrink-0`}>
                      Contact:
                    </span>
                    <span
                      className={`font-medium text-xs text-right ml-2 break-all ${valueTextClasses}`}
                    >
                      {payment.witnessContact}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {payment.description && (
              <div className={`border-t ${borderClasses} pt-3`}>
                <p className={`${labelTextClasses} text-sm mb-2`}>Notes:</p>
                <p
                  className={`text-sm ${notesBackgroundClasses} rounded-lg p-3 break-words ${valueTextClasses}`}
                >
                  {payment.description}
                </p>
              </div>
            )}

            {/* Proof image for uploaded receipts */}
            {payment.proofUrl && (
              <div className={`border-t ${borderClasses} pt-3`}>
                <p className={`${labelTextClasses} text-sm mb-2`}>
                  Proof Image:
                </p>
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <img
                    src={payment.proofUrl}
                    alt="Payment proof"
                    className={`w-full h-32 object-cover rounded-lg border ${borderClasses} hover:opacity-90 transition-opacity`}
                  />
                </a>
                <p className={`text-xs ${colors.text.muted} text-center mt-1`}>
                  Click to view full size
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className={`border-t ${borderClasses} pt-3 text-center`}>
              <p className={`text-xs ${colors.text.muted}`}>
                Personal Receipt - Keep for your records
              </p>
            </div>
          </div>

          {/* Close Button - Fixed at bottom */}
          <div
            className={`p-4 ${footerClasses} border-t ${borderClasses} rounded-b-2xl flex-shrink-0`}
          >
            <button
              onClick={onClose}
              className={`w-full py-3 ${buttonClasses} rounded-xl transition-colors font-medium active:scale-95 transform`}
            >
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptViewModal;
