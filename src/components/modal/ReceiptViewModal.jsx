const ReceiptViewModal = ({ payment, loan, open, onClose }) => {
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

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200 pt-5 pb-5 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-full mx-auto overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-slate-800 text-white p-4 text-center rounded-t-2xl flex-shrink-0 relative">
            <h2 className="text-lg font-bold mb-1">Payment Receipt</h2>
            <p className="text-slate-300 text-sm">Personal Transaction</p>
            <div className="mt-2 text-xs text-slate-400 font-mono">
              #{payment.receiptId}
            </div>
          </div>

          {/* Receipt Body - Scrollable */}
          <div className="p-4 bg-white text-slate-800 space-y-3 overflow-y-auto flex-1">
            {/* Amount */}
            <div className="text-center border-b border-slate-200 pb-3">
              <p className="text-slate-600 text-sm mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-slate-800">
                ₱{payment.amount.toLocaleString()}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium text-right">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span className="font-medium">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Method:</span>
                <span className="font-medium capitalize">
                  {payment.paymentMethod?.replace("_", " ") || "Cash"}
                </span>
              </div>
              {payment.location && (
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 flex-shrink-0">
                    Location:
                  </span>
                  <span className="font-medium text-right ml-2 break-words">
                    {payment.location}
                  </span>
                </div>
              )}
            </div>

            {/* Parties */}
            {loan && (
              <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 flex-shrink-0">
                    {loan.type === "lent" ? "Borrower:" : "Lender:"}
                  </span>
                  <span className="font-medium text-right ml-2 break-words">
                    {loan.personName}
                  </span>
                </div>
                {payment.witnessName && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 flex-shrink-0">
                      Witness:
                    </span>
                    <span className="font-medium text-right ml-2 break-words">
                      {payment.witnessName}
                    </span>
                  </div>
                )}
                {payment.witnessContact && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 flex-shrink-0">
                      Contact:
                    </span>
                    <span className="font-medium text-xs text-right ml-2 break-all">
                      {payment.witnessContact}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {payment.description && (
              <div className="border-t border-slate-200 pt-3">
                <p className="text-slate-600 text-sm mb-2">Notes:</p>
                <p className="text-sm bg-slate-50 rounded-lg p-3 break-words">
                  {payment.description}
                </p>
              </div>
            )}

            {/* NEW: Proof image for uploaded receipts */}
            {payment.proofUrl && (
              <div className="border-t border-slate-200 pt-3">
                <p className="text-slate-600 text-sm mb-2">Proof Image:</p>
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <img
                    src={payment.proofUrl}
                    alt="Payment proof"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                  />
                </a>
                <p className="text-xs text-slate-500 text-center mt-1">
                  Click to view full size
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className="border-t border-slate-200 pt-3 text-center">
              <p className="text-xs text-slate-500">
                Personal Receipt - Keep for your records
              </p>
            </div>
          </div>

          {/* Close Button - Fixed at bottom */}
          <div className="p-4 bg-slate-50 border-t rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium active:scale-95 transform"
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
