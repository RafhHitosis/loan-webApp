import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  List,
  DollarSign,
  LogOut,
  TrendingUp,
  TrendingDown,
  Mail,
  Lock,
  User,
  X,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowLeft,
  Menu,
  Home,
  Activity,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  push,
  set,
  remove,
  onValue,
  off,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const handleSignOut = async () => {
    return await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut: handleSignOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Loan Service (keeping your existing service)
const loanService = {
  getUserLoansRef: (userId) => ref(database, `loans/${userId}`),
  addLoan: async (userId, loanData) => {
    const loansRef = loanService.getUserLoansRef(userId);
    return await push(loansRef, {
      ...loanData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
  updateLoan: async (userId, loanId, loanData) => {
    const loanRef = ref(database, `loans/${userId}/${loanId}`);
    return await set(loanRef, { ...loanData, updatedAt: Date.now() });
  },
  deleteLoan: async (userId, loanId) => {
    const loanRef = ref(database, `loans/${userId}/${loanId}`);
    return await remove(loanRef);
  },
  subscribeToLoans: (userId, callback) => {
    const loansRef = loanService.getUserLoansRef(userId);
    onValue(loansRef, callback);
    return () => off(loansRef, "value", callback);
  },
};

// Enhanced Login Component with mobile-first design
const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? "Join Us" : "Welcome Back"}
          </h1>
          <p className="text-slate-400">
            {isSignUp
              ? "Create your account to start tracking"
              : "Sign in to continue"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard Component
const Dashboard = ({ loans }) => {
  const calculateSummary = () => {
    const lentLoans = loans.filter((loan) => loan.type === "lent");
    const borrowedLoans = loans.filter((loan) => loan.type === "borrowed");

    return {
      totalLent: lentLoans.reduce((sum, loan) => sum + loan.amount, 0),
      totalBorrowed: borrowedLoans.reduce((sum, loan) => sum + loan.amount, 0),
      activeLentCount: lentLoans.filter((loan) => loan.status === "active")
        .length,
      activeBorrowedCount: borrowedLoans.filter(
        (loan) => loan.status === "active"
      ).length,
    };
  };

  const summary = calculateSummary();
  const netPosition = summary.totalLent - summary.totalBorrowed;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-emerald-400/80 text-sm font-medium mb-1">
                Money Lent
              </p>
              <p className="text-2xl font-bold text-white mb-1">
                ₱{summary.totalLent.toLocaleString()}
              </p>
              <p className="text-emerald-400/60 text-xs">
                {summary.activeLentCount} active loans
              </p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-red-400/80 text-sm font-medium mb-1">
                Money Borrowed
              </p>
              <p className="text-2xl font-bold text-white mb-1">
                ₱{summary.totalBorrowed.toLocaleString()}
              </p>
              <p className="text-red-400/60 text-xs">
                {summary.activeBorrowedCount} active loans
              </p>
            </div>
            <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Net Position Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30 rounded-2xl p-8 text-center backdrop-blur-sm">
        <h3 className="text-slate-400 text-lg font-medium mb-4">
          Net Position
        </h3>
        <p
          className={`text-4xl font-bold mb-3 transition-colors duration-300 ${
            netPosition >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {netPosition >= 0 ? "+" : ""}₱{Math.abs(netPosition).toLocaleString()}
        </p>
        <p className="text-slate-500 text-sm">
          {netPosition >= 0
            ? "You are owed more than you owe"
            : "You owe more than you are owed"}
        </p>
      </div>
    </div>
  );
};

// Enhanced Loan Form Component
const LoanForm = ({ loan, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    type: "lent",
    date: new Date().toISOString().split("T")[0],
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (loan) {
      setFormData(loan);
    } else {
      setFormData({
        personName: "",
        amount: "",
        type: "lent",
        date: new Date().toISOString().split("T")[0],
        description: "",
        status: "active",
      });
    }
  }, [loan, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      id: loan?.id || null,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
          <h2 className="text-xl font-bold text-white">
            {loan ? "Edit Loan" : "Add New Loan"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[60vh] overflow-y-auto"
        >
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Person Name
            </label>
            <input
              type="text"
              value={formData.personName}
              onChange={(e) =>
                setFormData({ ...formData, personName: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              placeholder="Enter person's name"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                ₱
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "lent" })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  formData.type === "lent"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Money I Lent
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "borrowed" })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  formData.type === "borrowed"
                    ? "bg-red-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Money I Borrowed
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all duration-200"
              placeholder="Add a note about this loan..."
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "active" })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  formData.status === "active"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "paid" })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  formData.status === "paid"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-6 border-t border-slate-600/30">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loan ? "Update" : "Add"} Loan
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Loan List Component
const LoanList = ({ loans, onEdit, onDelete }) => {
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <DollarSign className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No loans yet</h3>
        <p className="text-slate-400 mb-6 max-w-sm">
          Start tracking your money by adding your first loan transaction
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      {loans.map((loan, index) => (
        <div
          key={loan.id}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-5 hover:bg-slate-800/70 transition-all duration-200 transform hover:scale-[1.01] animate-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {loan.personName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {loan.personName}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        loan.type === "lent"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {loan.type === "lent" ? "Lent" : "Borrowed"}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        loan.status === "active"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {loan.status === "active" ? "Active" : "Paid"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-2xl font-bold text-emerald-400 mb-2">
                ₱{loan.amount.toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm mb-1">
                {new Date(loan.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {loan.description && (
                <p className="text-slate-300 text-sm bg-slate-700/30 rounded-lg px-3 py-2 mt-2">
                  {loan.description}
                </p>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(loan)}
                className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all duration-200 flex items-center justify-center"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(loan.id)}
                className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-500/10" : "bg-emerald-500/10";
  const borderColor =
    type === "error" ? "border-red-500/30" : "border-emerald-500/30";
  const textColor = type === "error" ? "text-red-400" : "text-emerald-400";
  const Icon = type === "error" ? AlertTriangle : Check;

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 ${bgColor} ${borderColor} backdrop-blur-xl border px-4 py-4 rounded-2xl shadow-lg z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${
            type === "error" ? "bg-red-500/20" : "bg-emerald-500/20"
          } flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className={`flex-1 text-sm font-medium ${textColor}`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main App Component
const LoanTrackerApp = () => {
  const { user, signOut } = useAuth();
  const [loans, setLoans] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = loanService.subscribeToLoans(user.uid, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loansArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setLoans(loansArray.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setLoans([]);
      }
    });

    return unsubscribe;
  }, [user]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  const handleSaveLoan = async (loanData) => {
    try {
      if (loanData.id) {
        await loanService.updateLoan(user.uid, loanData.id, loanData);
        showNotification("Loan updated successfully!");
      } else {
        await loanService.addLoan(user.uid, loanData);
        showNotification("Loan added successfully!");
      }
      setShowLoanForm(false);
      setEditingLoan(null);
    } catch (error) {
      showNotification("Error saving loan: " + error.message, "error");
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await loanService.deleteLoan(user.uid, loanId);
        showNotification("Loan deleted successfully!");
      } catch (error) {
        showNotification("Error deleting loan: " + error.message, "error");
      }
    }
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      showNotification("Error signing out: " + error.message, "error");
    }
  };

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <header className="bg-slate-800/60 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Loan Tracker</h1>
                <p className="text-xs text-slate-400 truncate max-w-32">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 flex items-center justify-center"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {currentView === "dashboard" && <Dashboard loans={loans} />}
        {currentView === "loans" && (
          <LoanList
            loans={loans}
            onEdit={handleEditLoan}
            onDelete={handleDeleteLoan}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 z-40">
        <div className="grid grid-cols-2 gap-1 p-2">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
              currentView === "dashboard"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentView("loans")}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
              currentView === "loans"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-medium">All Loans</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingLoan(null);
          setShowLoanForm(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 mx-auto" />
      </button>

      {/* Loan Form Modal */}
      <LoanForm
        loan={editingLoan}
        open={showLoanForm}
        onClose={() => {
          setShowLoanForm(false);
          setEditingLoan(null);
        }}
        onSave={handleSaveLoan}
      />

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
    </div>
  );
};

// Loading Component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

// App Content Component (wrapped by AuthProvider)
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <LoanTrackerApp />;
};

// Root App Component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
