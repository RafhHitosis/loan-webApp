import React, { useState } from "react";
import {
  UserX,
  Mail,
  MessageCircle,
  Phone,
  X,
  Send,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { ref, push } from "firebase/database";
import { database } from "./../../lib/firebase";
import { useAuth } from "./../../contexts/AuthContext";

const AdminContactPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Contact Admin</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white font-medium">rafhhitosis@gmail.com</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Phone</p>
              <p className="text-white font-medium">+63 916 574 7801</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">Available Hours:</strong>
            <br />
            Monday - Friday: 9:00 AM - 6:00 PM
            <br />
            Response time: Within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

const AppealForm = ({ isOpen, onClose, userEmail, onSuccess }) => {
  const [appealText, setAppealText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appealText.trim()) {
      alert("Please enter your appeal message.");
      return;
    }

    setLoading(true);
    try {
      const appealsRef = ref(database, "appeals");
      await push(appealsRef, {
        email: userEmail,
        message: appealText.trim(),
        timestamp: Date.now(),
        status: "pending",
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        submittedFrom: "disabled-account-page",
      });

      setAppealText("");
      onSuccess();
    } catch (error) {
      console.error("Error submitting appeal:", error);
      alert(
        "Failed to submit appeal. Please try again or contact admin directly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Submit Appeal</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Email
            </label>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white">{userEmail}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Appeal Message *
            </label>
            <textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Please explain why you believe your account should be reactivated..."
              className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Be specific about your situation and why you believe this action
              was taken in error.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 text-slate-400 hover:text-slate-300 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !appealText.trim()}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppealSuccess = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Appeal Submitted!
          </h3>
          <p className="text-slate-400 mb-6">
            Your appeal has been submitted successfully. An administrator will
            review it within 24-48 hours.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DisabledAccountMessage = ({ userEmail }) => {
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [showAppealSuccess, setShowAppealSuccess] = useState(false);
  const { signOut } = useAuth();

  const handleAppealSuccess = () => {
    setShowAppealForm(false);
    setShowAppealSuccess(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserX className="w-10 h-10 text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              Account Disabled
            </h1>

            {/* Description */}
            <div className="text-slate-400 mb-8 leading-relaxed space-y-2">
              <p>
                Your account has been temporarily disabled by an administrator.
              </p>
              <p>
                This may be due to a violation of our terms of service or
                suspicious activity.
              </p>
              <p className="text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <strong className="text-slate-300">Account:</strong> {userEmail}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Contact Admin Button */}
              <button
                onClick={() => setShowContactPopup(true)}
                className="w-full px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Contact Administrator
              </button>

              {/* Appeal Button */}
              <button
                onClick={() => setShowAppealForm(true)}
                className="w-full px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Submit Appeal
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full px-6 py-4 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 text-slate-400 hover:text-slate-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Need help?</strong>
                <br />
                If you believe this is an error, please contact the admin using
                the details above.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      <AdminContactPopup
        isOpen={showContactPopup}
        onClose={() => setShowContactPopup(false)}
      />

      <AppealForm
        isOpen={showAppealForm}
        onClose={() => setShowAppealForm(false)}
        userEmail={userEmail}
        onSuccess={handleAppealSuccess}
      />

      <AppealSuccess
        isOpen={showAppealSuccess}
        onClose={() => setShowAppealSuccess(false)}
      />
    </>
  );
};

export default DisabledAccountMessage;
