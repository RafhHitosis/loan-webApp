import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from "react";
import {
  Plus,
  Edit3,
  Trash2,
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
  Home,
  Upload,
  FileImage,
  History,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
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
  get,
  update,
} from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Cloudinary Config
const CLOUDINARY_UPLOAD_PRESET = "receipt_upload";
const CLOUDINARY_CLOUD_NAME = "dpiupmmsg";

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

// Enhanced Loan Service
const loanService = {
  getUserLoansRef: (userId) => ref(database, `loans/${userId}`),

  addLoan: async (userId, loanData) => {
    const loansRef = loanService.getUserLoansRef(userId);
    return await push(loansRef, {
      ...loanData,
      remainingAmount: loanData.amount,
      payments: {}, // Initialize as empty object, not array
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  updateLoan: async (userId, loanId, loanData) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    const loanRef = ref(database, `loans/${userId}/${loanId}`);

    try {
      // Get current loan data first to preserve payments
      const currentSnapshot = await get(loanRef);
      const currentLoan = currentSnapshot.val();

      if (!currentLoan) {
        throw new Error("Loan not found");
      }

      // Calculate total paid from payments
      const payments = currentLoan.payments || {};
      const totalPaid = Object.values(payments).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);

      // Calculate new remaining amount based on new loan amount
      const newAmount = parseFloat(loanData.amount) || 0;
      const newRemainingAmount = Math.max(0, newAmount - totalPaid);

      // Determine new status
      let newStatus = loanData.status || currentLoan.status || "active";
      if (newRemainingAmount === 0 && totalPaid > 0) {
        newStatus = "paid";
      } else if (newRemainingAmount > 0 && totalPaid > 0) {
        newStatus = "active"; // Partially paid
      }

      const updatedLoan = {
        ...currentLoan, // Preserve existing data including payments
        ...loanData,
        amount: newAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        updatedAt: Date.now(),
        // Ensure payments are preserved
        payments: currentLoan.payments || {},
      };

      return await set(loanRef, updatedLoan);
    } catch (error) {
      console.error("Error updating loan:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  },

  addPayment: async (userId, loanId, paymentData) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    try {
      const paymentRef = ref(database, `loans/${userId}/${loanId}/payments`);

      // ADD validation to check if loan exists first
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const paymentKey = await push(paymentRef, {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        timestamp: paymentData.timestamp || Date.now(), // Ensure timestamp is set
      });

      console.log("Payment saved to Firebase with key:", paymentKey.key); // ADD this line
      return paymentKey.key;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw new Error(`Failed to add payment: ${error.message}`);
    }
  },

  // NEW: Method to update loan after payment without losing data
  updateLoanAfterPayment: async (
    userId,
    loanId,
    newRemainingAmount,
    newStatus
  ) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    try {
      // ADD validation to check if loan exists first
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const updates = {
        [`loans/${userId}/${loanId}/remainingAmount`]:
          parseFloat(newRemainingAmount), // Ensure it's a number
        [`loans/${userId}/${loanId}/status`]: newStatus,
        [`loans/${userId}/${loanId}/updatedAt`]: Date.now(),
      };

      console.log("Updating loan with:", updates); // ADD this line
      const result = await update(ref(database), updates);
      console.log("Update result:", result); // ADD this line

      return result;
    } catch (error) {
      console.error("Error updating loan after payment:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
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

  deletePayment: async (userId, loanId, paymentId) => {
    if (!userId || !loanId || !paymentId) {
      throw new Error("User ID, Loan ID, and Payment ID are required");
    }

    try {
      const paymentRef = ref(
        database,
        `loans/${userId}/${loanId}/payments/${paymentId}`
      );

      // Get the payment data before deleting to calculate refund amount
      const paymentSnapshot = await get(paymentRef);
      if (!paymentSnapshot.exists()) {
        throw new Error("Payment not found");
      }

      const paymentData = paymentSnapshot.val();
      const refundAmount = parseFloat(paymentData.amount) || 0;

      // Delete the payment
      await remove(paymentRef);

      return { refundAmount, paymentData };
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  },

  // ADD this method to update loan after payment deletion
  updateLoanAfterPaymentDeletion: async (userId, loanId, refundAmount) => {
    if (!userId || !loanId) {
      throw new Error("User ID and Loan ID are required");
    }

    try {
      const loanRef = ref(database, `loans/${userId}/${loanId}`);
      const loanSnapshot = await get(loanRef);

      if (!loanSnapshot.exists()) {
        throw new Error("Loan not found");
      }

      const currentLoan = loanSnapshot.val();
      const currentRemaining = parseFloat(currentLoan.remainingAmount) || 0;
      const originalAmount = parseFloat(currentLoan.amount) || 0;

      // Add the refund amount back to remaining
      const newRemainingAmount = Math.min(
        originalAmount,
        currentRemaining + refundAmount
      );

      // Determine new status
      const newStatus =
        newRemainingAmount === originalAmount
          ? "active"
          : newRemainingAmount === 0
          ? "paid"
          : "active";

      const updates = {
        [`loans/${userId}/${loanId}/remainingAmount`]: newRemainingAmount,
        [`loans/${userId}/${loanId}/status`]: newStatus,
        [`loans/${userId}/${loanId}/updatedAt`]: Date.now(),
      };

      return await update(ref(database), updates);
    } catch (error) {
      console.error("Error updating loan after payment deletion:", error);
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  },
};

// Cloudinary Service
const cloudinaryService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return await response.json();
  },

  // ADD this new method for deleting images
  deleteImage: async (publicId) => {
    if (!publicId) return;

    try {
      // Note: For security, image deletion usually requires server-side implementation
      // This is a client-side approach that may have limitations
      const timestamp = Math.round(new Date().getTime() / 1000);
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET; // You'll need to add this to env

      if (!apiSecret) {
        console.warn(
          "Cloudinary API secret not found. Image deletion skipped."
        );
        return;
      }

      // Generate signature for secure deletion
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = await crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(stringToSign)
      );
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("timestamp", timestamp);
      formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY);
      formData.append("signature", signatureHex);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        console.warn(
          "Failed to delete image from Cloudinary:",
          await response.text()
        );
      }
    } catch (error) {
      console.warn("Error deleting image from Cloudinary:", error);
      // Don't throw error - deletion should not fail if Cloudinary cleanup fails
    }
  },
};

// Reusable Components
const Input = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
    )}
    <input
      className={`w-full ${
        Icon ? "pl-12" : "pl-4"
      } pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 ${className}`}
      {...props}
    />
  </div>
);

const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg",
    secondary:
      "bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white",
    ghost: "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", hover = true }) => (
  <div
    className={`bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-4 ${
      // Changed from p-6 to p-4
      hover
        ? "hover:bg-slate-800/80 transition-all duration-200 transform hover:scale-[1.01]"
        : ""
    } ${className}`}
  >
    {children}
  </div>
);

// Login Component
const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (err) {
      // Friendly error messages
      let errorMessage = err.message;
      if (errorMessage.includes("user-not-found")) {
        errorMessage = "No account found with this email";
      } else if (errorMessage.includes("wrong-password")) {
        errorMessage = "Incorrect password";
      } else if (errorMessage.includes("email-already-in-use")) {
        errorMessage = "An account with this email already exists";
      } else if (errorMessage.includes("weak-password")) {
        errorMessage = "Password is too weak";
      } else if (errorMessage.includes("invalid-email")) {
        errorMessage = "Invalid email address";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg">
            <span className="w-10 h-10 text-white text-5xl font-bold flex items-center justify-center">
              ₱
            </span>
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

        {/* REPLACE the error div with ErrorMessage component */}
        <ErrorMessage error={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            icon={Mail}
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            required
          />

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              required
              minLength="6"
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

          <Button size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(""); // Clear errors when switching
            }}
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

// Dashboard Component
const Dashboard = ({ loans }) => {
  const calculateSummary = () => {
    if (!Array.isArray(loans)) {
      return {
        totalLent: 0,
        totalBorrowed: 0,
        activeLentCount: 0,
        activeBorrowedCount: 0,
      };
    }

    const lentLoans = loans.filter((loan) => loan?.type === "lent");
    const borrowedLoans = loans.filter((loan) => loan?.type === "borrowed");

    return {
      totalLent: lentLoans.reduce((sum, loan) => {
        const remaining =
          parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0;
        return sum + remaining;
      }, 0),
      totalBorrowed: borrowedLoans.reduce((sum, loan) => {
        const remaining =
          parseFloat(loan?.remainingAmount) || parseFloat(loan?.amount) || 0;
        return sum + remaining;
      }, 0),
      activeLentCount: lentLoans.filter((loan) => loan?.status === "active")
        .length,
      activeBorrowedCount: borrowedLoans.filter(
        (loan) => loan?.status === "active"
      ).length,
    };
  };

  const summary = calculateSummary();
  const netPosition = summary.totalLent - summary.totalBorrowed;

  const StatCard = ({
    title,
    amount,
    count,
    icon: Icon, // eslint-disable-line no-unused-vars
    gradient,
    textColor,
  }) => (
    <Card
      className={`bg-gradient-to-br ${gradient} border-${
        textColor.split("-")[1]
      }-500/30`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-200 text-sm font-medium mb-1">{title}</p>{" "}
          {/* Changed from textColor/80 to slate-200 */}
          <p className="text-3xl font-bold text-white mb-1">
            {" "}
            {/* Changed text-2xl to text-3xl for better visibility */}₱
            {amount.toLocaleString()}
          </p>
          <p className="text-slate-300 text-xs">{count} active loans</p>{" "}
          {/* Changed from textColor/60 to slate-300 */}
        </div>
        <div
          className={`w-14 h-14 bg-${
            textColor.split("-")[1]
          }-500/20 rounded-2xl flex items-center justify-center`}
        >
          <Icon className={`w-7 h-7 ${textColor}`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Money Lent"
          amount={summary.totalLent}
          count={summary.activeLentCount}
          icon={TrendingUp}
          gradient="from-emerald-500/10 to-emerald-600/5"
          textColor="text-emerald-400"
        />
        <StatCard
          title="Money Borrowed"
          amount={summary.totalBorrowed}
          count={summary.activeBorrowedCount}
          icon={TrendingDown}
          gradient="from-red-500/10 to-red-600/5"
          textColor="text-red-400"
        />
      </div>

      <Card
        className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/30 text-center"
        hover={false}
      >
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
      </Card>
    </div>
  );
};

// Payment History Component
const PaymentHistory = ({ payments = {}, loan, onDeletePayment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // ADD this
  const [paymentToDelete, setPaymentToDelete] = useState(null); // ADD this

  const paymentsArray = useMemo(() => {
    if (!payments || typeof payments !== "object") {
      return [];
    }

    try {
      return Object.entries(payments)
        .filter(([, payment]) => payment && typeof payment === "object")
        .map(([paymentId, payment]) => ({
          ...payment,
          id: paymentId,
          amount: parseFloat(payment.amount) || 0,
          timestamp: payment.timestamp || Date.now(),
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
      console.error("Error processing payments:", error);
      return [];
    }
  }, [payments]);

  const handleViewReceipt = (payment) => {
    setSelectedReceipt({ payment, loan });
    setShowReceiptModal(true);
  };

  // MODIFY this function to show confirmation modal instead of direct deletion
  const handleDeleteReceipt = async (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteConfirm(true);
  };

  // ADD this new function to handle confirmed deletion
  const handleConfirmDelete = async () => {
    try {
      if (onDeletePayment && paymentToDelete) {
        await onDeletePayment(paymentToDelete, loan);
      }
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  if (!paymentsArray.length) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400 text-sm">No payments recorded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 bg-slate-700/20 hover:bg-slate-700/30 rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-300" />
            <span className="text-slate-200 font-medium text-sm">
              Payment History ({paymentsArray.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {paymentsArray.map((payment, index) => (
              <div
                key={payment.id || index}
                className="bg-slate-700/30 rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-300 font-semibold text-sm">
                    ₱{(payment.amount || 0).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">
                      {payment.timestamp
                        ? new Date(payment.timestamp).toLocaleDateString()
                        : "Unknown"}
                    </span>
                    <button
                      onClick={() => handleDeleteReceipt(payment)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                      title="Delete payment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payment.type === "manual" ? (
                    <>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        Manual Receipt
                      </span>
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs underline"
                      >
                        View Receipt
                      </button>
                    </>
                  ) : (
                    payment.proofUrl && (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-xs"
                      >
                        <FileImage className="w-3 h-3" />
                        View Proof
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptViewModal
        payment={selectedReceipt?.payment}
        loan={selectedReceipt?.loan}
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
      />

      {/* ADD Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment of ₱${(
          paymentToDelete?.amount || 0
        ).toLocaleString()}? This will add the amount back to the remaining loan balance and cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        type="danger"
      />
    </>
  );
};

// Proof Upload Component
const ProofUploadModal = ({ loan, open, onClose, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false); // NEW: Preview modal state

  useEffect(() => {
    if (open) {
      setPaymentAmount("");
      setSelectedFile(null);
      setPreview("");
      setError("");
      setShowPreview(false); // NEW: Reset preview state
    }
  }, [open]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      setError("");
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(paymentAmount);
    const maxAmount = parseFloat(loan?.remainingAmount) || 0;

    // Validation
    if (!selectedFile) {
      setError("Please select a proof image");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (amount > maxAmount) {
      setError(
        `Payment amount cannot exceed remaining amount of ₱${maxAmount.toLocaleString()}`
      );
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await cloudinaryService.uploadImage(selectedFile);

      await onUpload({
        amount: amount,
        proofUrl: uploadResult.secure_url,
        proofPublicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setError(`Failed to upload proof: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
            <h2 className="text-xl font-bold text-white">
              Upload Proof of Payment
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="p-6 space-y-5">
            <ErrorMessage error={error} onClose={() => setError("")} />

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Payment Amount (Max: ₱
                {(loan?.remainingAmount || 0).toLocaleString()})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  ₱
                </span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  placeholder="0.00"
                  min="0"
                  max={loan?.remainingAmount || 0}
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Upload Proof
              </label>
              <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="proof-upload"
                  required
                />
                <label htmlFor="proof-upload" className="cursor-pointer">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
                      />
                      {/* NEW: Preview button */}
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-200"
                        title="Preview image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">
                        Click to select image
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || !selectedFile || !paymentAmount}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  "Upload Proof"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* NEW: Image Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] m-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const ManualReceiptModal = ({ loan, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    witnessName: "",
    witnessContact: "",
    description: "",
    paymentMethod: "cash",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        location: "",
        witnessName: "",
        witnessContact: "",
        description: "",
        paymentMethod: "cash",
      });
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(formData.amount);
    const maxAmount = parseFloat(loan?.remainingAmount) || 0;

    // Validation
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (amount > maxAmount) {
      setError(
        `Payment amount cannot exceed remaining amount of ₱${maxAmount.toLocaleString()}`
      );
      return;
    }

    if (!formData.location.trim()) {
      setError("Please enter the location where payment was made");
      return;
    }

    try {
      // Call onSave and wait for it to complete
      await onSave({
        ...formData,
        amount: amount,
        type: "manual",
        receiptId: `MR-${Date.now()}`,
        timestamp: new Date(`${formData.date}T${formData.time}`).getTime(),
      });

      // Don't call onClose here - let the parent component handle it
    } catch (error) {
      console.error("Save failed:", error);
      setError(`Failed to save receipt: ${error.message}`);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
          <h2 className="text-xl font-bold text-white">Manual Receipt</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <ErrorMessage error={error} onClose={() => setError("")} />

          {/* Amount and Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                required
              />
            </div>
          </div>

          {/* Time and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => updateFormData("time", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  updateFormData("paymentMethod", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              placeholder="Where was the payment made?"
              required
            />
          </div>

          {/* Witness Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Witness Name (Optional)
              </label>
              <input
                type="text"
                value={formData.witnessName}
                onChange={(e) => updateFormData("witnessName", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Witness Contact (Optional)
              </label>
              <input
                type="text"
                value={formData.witnessContact}
                onChange={(e) =>
                  updateFormData("witnessContact", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                placeholder="Phone/Email"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
              maxLength="200"
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none text-sm"
              placeholder="Additional details about the payment..."
            />
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">
                {formData.description.length}/200
              </span>
            </div>
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-slate-600/30">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            {" "}
            {/* CHANGE from form submit to onClick */}
            Save Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

// Receipt View Modal Component
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

// Enhanced Loan Form Component
const LoanForm = ({ loan, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    type: "lent",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // ADD this
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false); // ADD this
  const [originalData, setOriginalData] = useState(null); // ADD this

  useEffect(() => {
    if (loan) {
      const loanData = {
        ...loan,
        amount: (loan.amount || 0).toString(),
        personName: loan.personName || "",
        type: loan.type || "lent",
        date: loan.date || new Date().toISOString().split("T")[0],
        dueDate: loan.dueDate || "",
        description: loan.description || "",
        status: loan.status || "active",
      };
      setFormData(loanData);
      setOriginalData(loanData); // Store original data
    } else {
      const newLoanData = {
        personName: "",
        amount: "",
        type: "lent",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        description: "",
        status: "active",
      };
      setFormData(newLoanData);
      setOriginalData(newLoanData);
    }
    setError("");
    setHasUnsavedChanges(false); // Reset unsaved changes
  }, [loan, open]);

  const checkForChanges = (newData) => {
    if (!originalData) return false;
    return JSON.stringify(newData) !== JSON.stringify(originalData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(formData.amount);

    if (!formData.personName?.trim()) {
      setError("Please enter person's name");
      return;
    }

    if (formData.personName.trim().length > 100) {
      setError("Person's name must be less than 100 characters");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (amount > 999999999) {
      setError("Amount is too large");
      return;
    }

    onSave({
      ...formData,
      amount: amount,
      id: loan?.id || null,
    });
    setHasUnsavedChanges(false); // Reset after save
  };

  const updateFormData = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasUnsavedChanges(checkForChanges(newData)); // Check for changes
    if (error) setError("");
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-slate-800/95 backdrop-blur-xl border-t border-slate-600/50 sm:border sm:border-slate-600/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                {loan ? "Edit Loan" : "Add New Loan"}
              </h2>
              {/* ADD unsaved changes indicator */}
              {hasUnsavedChanges && (
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                  title="Unsaved changes"
                ></div>
              )}
            </div>
            <button
              onClick={handleClose} // CHANGE from onClose to handleClose
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[60vh] overflow-y-auto"
          >
            {/* ADD ErrorMessage component here */}
            <ErrorMessage error={error} onClose={() => setError("")} />

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Person Name
              </label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => updateFormData("personName", e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                placeholder="Enter person's name"
                required
                minLength="1"
                maxLength="100"
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
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Rest of the form remains the same */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["lent", "borrowed"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData("type", type)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.type === type
                        ? type === "lent"
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Money I {type === "lent" ? "Lent" : "Borrowed"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData("dueDate", e.target.value)}
                min={formData.date} // Prevent due date before loan date
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                maxLength="500"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all duration-200"
                placeholder="Add a note about this loan..."
              />
              <div className="text-right mt-1">
                <span className="text-xs text-slate-400">
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["active", "paid"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateFormData("status", status)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.status === status
                        ? status === "active"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {status === "active" ? "Active" : "Paid"}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="flex gap-3 p-6 border-t border-slate-600/30">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {loan ? "Update" : "Add"} Loan
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirm={() => {
          setShowUnsavedWarning(false);
          setHasUnsavedChanges(false);
          onClose();
        }}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
      />
    </>
  );
};

// Replace the getDueDateStatus function (around line 1450-1470)
const getDueDateStatus = (loan) => {
  // CHANGE: Accept full loan object instead of just dueDate
  if (!loan?.dueDate || loan.status === "paid") return null;

  // ADDITIONAL CHECK: Don't show due date status if remaining amount is 0
  const remainingAmount =
    parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
  if (remainingAmount === 0) return null;

  const today = new Date();
  const due = new Date(loan.dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue", days: Math.abs(diffDays), color: "red" };
  } else if (diffDays <= 3) {
    return { status: "due-soon", days: diffDays, color: "amber" };
  } else if (diffDays <= 7) {
    return { status: "upcoming", days: diffDays, color: "blue" };
  }
  return { status: "normal", days: diffDays, color: "slate" };
};

// Enhanced Loan List Component
const LoanList = ({
  loans,
  onEdit,
  onDelete,
  onUploadProof,
  onAddManualReceipt,
  onDeletePayment, // ADD this line
}) => {
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="w-10 h-10 text-slate-400 text-5xl font-bold flex items-center justify-center">
            ₱
          </span>
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
      {loans.map((loan, index) => {
        if (!loan) return null;

        const originalAmount = parseFloat(loan.amount) || 0;
        const remainingAmount =
          parseFloat(loan.remainingAmount) || originalAmount;
        const totalPaid = Math.max(0, originalAmount - remainingAmount);

        const dueDateStatus = getDueDateStatus(loan);
        const isDueSoon =
          dueDateStatus &&
          ["overdue", "due-soon"].includes(dueDateStatus.status);

        // Compute payments array directly, not using useMemo
        let payments = [];
        if (loan.payments && typeof loan.payments === "object") {
          try {
            payments = Object.values(loan.payments)
              .filter((payment) => payment && typeof payment === "object")
              .map((payment) => ({
                ...payment,
                amount: parseFloat(payment.amount) || 0,
                timestamp: payment.timestamp || Date.now(),
              }))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          } catch (error) {
            console.error(
              "Error processing payments for loan:",
              loan.id,
              error
            );
            payments = [];
          }
        }

        const hasPayments = payments.length > 0;

        return (
          <Card
            key={loan.id || index}
            className={`animate-in slide-in-from-bottom-2 p-4 relative ${
              isDueSoon
                ? dueDateStatus?.status === "overdue"
                  ? "ring-2 ring-red-400/50 shadow-lg shadow-red-500/10 animate-pulse border-red-400/30"
                  : "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10 animate-pulse border-amber-400/30"
                : ""
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                  {loan.personName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white truncate mb-1">
                    {loan.personName}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        loan.type === "lent"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {loan.type === "lent" ? "Lent" : "Borrowed"}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        loan.status === "active"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {loan.status === "active" ? "Active" : "Paid"}
                    </span>
                    {/* ADD due date badge here with existing badges */}
                    {dueDateStatus && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          dueDateStatus.status === "overdue"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                            : dueDateStatus.status === "due-soon"
                            ? "bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse"
                            : dueDateStatus.status === "upcoming"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {dueDateStatus.status === "overdue"
                          ? `${dueDateStatus.days}d overdue`
                          : dueDateStatus.status === "due-soon"
                          ? dueDateStatus.days === 0
                            ? "Due today"
                            : `Due in ${dueDateStatus.days}d`
                          : `${dueDateStatus.days}d left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Amount Info */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Original</p>
                <p className="text-white font-semibold text-sm">
                  ₱{loan.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                {loan.status === "paid" ? (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Status</p>
                    <p className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" />
                      PAID
                    </p>
                  </>
                ) : remainingAmount === loan.amount ? (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Status</p>
                    <p className="text-amber-300 font-bold text-sm">UNPAID</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-xs mb-1">Remaining</p>
                    <p className="text-amber-300 font-bold text-base">
                      ₱{remainingAmount.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar - Only show if there are payments */}
            {totalPaid > 0 && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-xs">Progress</span>
                  <span className="text-slate-400 text-xs">
                    {((totalPaid / loan.amount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(totalPaid / loan.amount) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Compact Date and Description */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-col">
                <p className="text-slate-400 text-xs">
                  Created:{" "}
                  {new Date(loan.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </p>
                {loan.dueDate && (
                  <p
                    className={`text-xs mt-0.5 ${
                      dueDateStatus?.status === "overdue"
                        ? "text-red-400 font-medium"
                        : dueDateStatus?.status === "due-soon"
                        ? "text-amber-400 font-medium"
                        : "text-slate-400"
                    }`}
                  >
                    Due:{" "}
                    {new Date(loan.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </p>
                )}
              </div>
              {totalPaid > 0 && (
                <p className="text-emerald-400 text-xs font-medium">
                  ₱{totalPaid.toLocaleString()} paid
                </p>
              )}
            </div>

            {loan.description && (
              <p className="text-slate-200 text-xs bg-slate-700/30 rounded-lg px-2 py-1 mb-3 line-clamp-2">
                {loan.description}
              </p>
            )}

            {/* Collapsible Payment History */}
            {hasPayments && (
              <div className="mb-3">
                <PaymentHistory
                  payments={loan.payments}
                  loan={loan}
                  onDeletePayment={onDeletePayment} // ADD this line
                />
              </div>
            )}

            {/* NEW: Action buttons moved to bottom in a horizontal row */}
            <div className="flex gap-2 pt-2 border-t border-slate-600/30">
              {remainingAmount > 0 && loan.status === "active" && (
                <>
                  <button
                    onClick={() => onUploadProof(loan)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all duration-200 text-xs font-medium"
                    title="Upload proof"
                  >
                    <Upload className="w-3 h-3" />
                    Proof
                  </button>
                  <button
                    onClick={() => onAddManualReceipt(loan)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-green-500/20 text-slate-400 hover:text-green-400 rounded-lg transition-all duration-200 text-xs font-medium"
                    title="Manual receipt"
                  >
                    <FileImage className="w-3 h-3" />
                    Receipt
                  </button>
                </>
              )}
              <button
                onClick={() => onEdit(loan)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all duration-200 text-xs font-medium"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(loan)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200 text-xs font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>

            {/* Latest Proof Link - Only if no payment history shown */}
            {hasPayments &&
              !hasPayments &&
              (() => {
                const latestWithProof = payments.find((p) => p.proofUrl);
                return latestWithProof?.proofUrl ? (
                  <a
                    href={latestWithProof.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <FileImage className="w-3 h-3" />
                    Latest Proof
                  </a>
                ) : null;
              })()}
          </Card>
        );
      })}
    </div>
  );
};

// Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return; // ADD this check

    console.log("Notification mounted:", message, type); // ADD this line
    const timer = setTimeout(() => {
      console.log("Auto-closing notification"); // ADD this line
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) return null;

  const config = {
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      iconBg: "bg-red-500/20",
      Icon: AlertTriangle,
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      Icon: Check,
    },
  };

  const { bg, border, text, iconBg, Icon } = config[type] || config.success;

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 ${bg} ${border} backdrop-blur-xl border px-4 py-4 rounded-2xl shadow-lg z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className={`flex-1 text-sm font-medium ${text}`}>{message}</span>
        <button
          onClick={onClose}
          className={`${text} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger" or "warning"
}) => {
  if (!open) return null;

  const typeStyles = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      confirmBtn:
        "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    },
    warning: {
      icon: LogOut,
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      confirmBtn:
        "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={false}
            >
              {cancelText}
            </Button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg px-4 py-3 ${style.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
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
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const [showManualReceipt, setShowManualReceipt] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ type: "all", status: "all" });

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((loan) =>
        loan.personName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((loan) => loan.type === filters.type);
    }

    // Apply status filter (including due date filters)
    if (filters.status !== "all") {
      if (filters.status === "overdue") {
        filtered = filtered.filter((loan) => {
          if (loan.status !== "active" || !loan.dueDate) return false;
          const now = new Date();
          const dueDate = new Date(loan.dueDate);
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diffDays <= 0;
        });
      } else if (filters.status === "due-soon") {
        filtered = filtered.filter((loan) => {
          if (loan.status !== "active" || !loan.dueDate) return false;
          const now = new Date();
          const dueDate = new Date(loan.dueDate);
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diffDays > 0 && diffDays <= 3;
        });
      } else {
        filtered = filtered.filter((loan) => loan.status === filters.status);
      }
    }

    return filtered;
  }, [loans, searchQuery, filters]);

  useEffect(() => {
    if (!user) return;

    console.log("Setting up loan subscription for user:", user.uid); // ADD this line

    const unsubscribe = loanService.subscribeToLoans(user.uid, (snapshot) => {
      try {
        const data = snapshot.val();
        console.log("Received loan data from Firebase:", data); // ADD this line

        if (data) {
          const loansArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          console.log("Processed loans array:", loansArray); // ADD this line
          setLoans(loansArray.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          console.log("No loan data received"); // ADD this line
          setLoans([]);
        }
      } catch (error) {
        console.error("Error processing loan data:", error); // ADD this line
        showNotification("Error loading loans: " + error.message, "error");
      }
    });

    return unsubscribe;
  }, [user]);

  const handleAddManualReceipt = (loan) => {
    setSelectedLoan(loan);
    setShowManualReceipt(true);
  };

  const handleManualReceiptSave = async (receiptData) => {
    try {
      const { amount, ...receiptDetails } = receiptData;
      const loan = selectedLoan;

      console.log(
        "Starting manual receipt save for loan:",
        loan.id,
        "Amount:",
        amount
      );

      // Add manual payment record
      const paymentKey = await loanService.addPayment(user.uid, loan.id, {
        ...receiptDetails,
        amount,
        type: "manual",
        timestamp: receiptData.timestamp || Date.now(),
      });

      console.log("Manual payment added with key:", paymentKey);

      // Calculate new remaining amount
      const newRemainingAmount = Math.max(
        0,
        (loan.remainingAmount || loan.amount) - amount
      );
      const newStatus = newRemainingAmount === 0 ? "paid" : "active";

      console.log(
        "Updating loan - Remaining:",
        newRemainingAmount,
        "Status:",
        newStatus
      );

      // Update loan status
      await loanService.updateLoanAfterPayment(
        user.uid,
        loan.id,
        newRemainingAmount,
        newStatus
      );

      console.log("Loan updated successfully");

      // Show notification
      showNotification(
        `Manual receipt of ₱${amount.toLocaleString()} saved successfully!`
      );

      // Close modal and clear selected loan
      setShowManualReceipt(false);
      setSelectedLoan(null);
    } catch (error) {
      console.error("Error saving manual receipt:", error);
      showNotification(
        "Error saving manual receipt: " + error.message,
        "error"
      );
    }
  };

  const handleDeletePayment = async (payment, loan) => {
    try {
      // If it's an uploaded proof with Cloudinary public ID, delete from Cloudinary first
      if (payment.proofPublicId) {
        try {
          await cloudinaryService.deleteImage(payment.proofPublicId);
          console.log("Image deleted from Cloudinary:", payment.proofPublicId);
        } catch (cloudinaryError) {
          console.warn(
            "Failed to delete image from Cloudinary:",
            cloudinaryError
          );
          // Continue with payment deletion even if Cloudinary deletion fails
        }
      }

      // Delete the payment and get refund amount
      const { refundAmount } = await loanService.deletePayment(
        user.uid,
        loan.id,
        payment.id
      );

      // Update the loan with the refunded amount
      await loanService.updateLoanAfterPaymentDeletion(
        user.uid,
        loan.id,
        refundAmount
      );

      showNotification(
        `Payment of ₱${refundAmount.toLocaleString()} deleted and refunded to loan balance`
      );
    } catch (error) {
      console.error("Error deleting payment:", error);
      showNotification("Error deleting payment: " + error.message, "error");
    }
  };

  const showNotification = (message, type = "success") => {
    console.log("Showing notification:", message, type); // ADD this line
    // Clear any existing notification first
    setNotification({ message: "", type: "" });

    // Use setTimeout to ensure the state update happens
    setTimeout(() => {
      setNotification({ message, type });
    }, 100);
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
      console.error("Error saving loan:", error); // ADD this line
      showNotification("Error saving loan: " + error.message, "error");
    }
  };

  const initiateDelete = (loan) => {
    setLoanToDelete(loan);
    setShowDeleteConfirm(true);
  };

  const handleDeleteLoan = async (loanId) => {
    try {
      await loanService.deleteLoan(user.uid, loanId);
      showNotification("Loan deleted successfully!");
      setShowDeleteConfirm(false);
      setLoanToDelete(null);
    } catch (error) {
      showNotification("Error deleting loan: " + error.message, "error");
    }
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  const handleUploadProof = (loan) => {
    setSelectedLoan(loan);
    setShowProofUpload(true);
  };

  const handleProofUpload = async (paymentData) => {
    try {
      const { amount, proofUrl, proofPublicId } = paymentData;
      const loan = selectedLoan;

      console.log(
        "Starting proof upload for loan:",
        loan.id,
        "Amount:",
        amount
      );

      // Add payment record first
      const paymentKey = await loanService.addPayment(user.uid, loan.id, {
        amount,
        proofUrl,
        proofPublicId,
        timestamp: Date.now(),
      });

      console.log("Payment added with key:", paymentKey);

      // Calculate new remaining amount
      const newRemainingAmount = Math.max(
        0,
        (loan.remainingAmount || loan.amount) - amount
      );
      const newStatus = newRemainingAmount === 0 ? "paid" : "active";

      console.log(
        "Updating loan - Remaining:",
        newRemainingAmount,
        "Status:",
        newStatus
      );

      // Update the loan
      await loanService.updateLoanAfterPayment(
        user.uid,
        loan.id,
        newRemainingAmount,
        newStatus
      );

      console.log("Loan updated successfully");

      // Show notification
      showNotification(
        `Payment of ₱${amount.toLocaleString()} recorded successfully!`
      );

      // Close modal and clear selected loan
      setShowProofUpload(false);
      setSelectedLoan(null);
    } catch (error) {
      console.error("Error uploading proof:", error);
      showNotification("Error uploading proof: " + error.message, "error");
    }
  };

  const initiateLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showNotification("Signed out successfully!");
    } catch (error) {
      showNotification("Error signing out: " + error.message, "error");
    }
  };

  if (!user) {
    return <LoginForm />;
  }

  const NavigationButton = (
    { view, icon: Icon, label, isActive } // eslint-disable-line no-unused-vars
  ) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
        isActive
          ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
      }`}
    >
      {/* Animated background glow for active state */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-emerald-400/5 rounded-xl animate-pulse"></div>
      )}

      {/* Icon with bounce animation on hover */}
      <div className="relative z-10 transition-transform duration-200 hover:scale-110">
        <Icon
          className={`w-5 h-5 transition-all duration-300 ${
            isActive ? "drop-shadow-lg" : ""
          }`}
        />
      </div>

      {/* Label with slide animation */}
      <span
        className={`relative z-10 text-xs font-medium transition-all duration-300 ${
          isActive ? "tracking-wide" : ""
        }`}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <header className="bg-slate-800/60 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="w-6 h-6 text-white text-2xl font-bold flex items-center justify-center">
                  ₱
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Loan Tracker</h1>
                <p className="text-xs text-slate-400 truncate max-w-32">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={initiateLogout} // CHANGE from handleLogout to initiateLogout
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
          <div className="space-y-4">
            <FilterSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFilters}
              loans={loans}
            />
            <DueDateWarning loans={loans} />
            <LoanList
              loans={filteredLoans}
              onEdit={handleEditLoan}
              onDelete={initiateDelete}
              onUploadProof={handleUploadProof}
              onAddManualReceipt={handleAddManualReceipt}
              onDeletePayment={handleDeletePayment}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 z-40 transition-all duration-300">
        {/* Add a subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

        <div className="grid grid-cols-2 gap-1 p-2">
          <NavigationButton
            view="dashboard"
            icon={Home}
            label="Dashboard"
            isActive={currentView === "dashboard"}
          />
          <NavigationButton
            view="loans"
            icon={List}
            label="All Loans"
            isActive={currentView === "loans"}
          />
        </div>

        {/* Animated sliding indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-transform duration-500 ease-out ${
              currentView === "dashboard"
                ? "transform translate-x-0 w-1/2"
                : "transform translate-x-full w-1/2"
            }`}
          ></div>
        </div>
      </nav>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingLoan(null);
          setShowLoanForm(true);
        }}
        className="fixed bottom-25 right-4 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 mx-auto" />
      </button>

      {/* Modals */}
      <LoanForm
        loan={editingLoan}
        open={showLoanForm}
        onClose={() => {
          setShowLoanForm(false);
          setEditingLoan(null);
        }}
        onSave={handleSaveLoan}
      />

      <ProofUploadModal
        loan={selectedLoan}
        open={showProofUpload}
        onClose={() => {
          setShowProofUpload(false);
          setSelectedLoan(null);
        }}
        onUpload={handleProofUpload}
      />

      <ManualReceiptModal
        loan={selectedLoan}
        open={showManualReceipt}
        onClose={() => {
          setShowManualReceipt(false);
          setSelectedLoan(null);
        }}
        onSave={handleManualReceiptSave}
      />

      {/* ADD Confirmation Modals */}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setLoanToDelete(null);
        }}
        onConfirm={() => handleDeleteLoan(loanToDelete?.id)}
        title="Delete Loan"
        message={`Are you sure you want to delete the loan with ${
          loanToDelete?.personName || "this person"
        }? This action cannot be undone and will remove all payment history.`}
        confirmText="Delete Loan"
        cancelText="Keep Loan"
        type="danger"
      />

      <ConfirmationModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your loans."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        type="warning"
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

const FilterSearchBar = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  loans,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
  if (!loans || loans.length === 0) return null;

  const resetFilters = () => {
    setFilters({ type: "all", status: "all" });
    setSearchQuery("");
    setShowSearch(false);
  };

  const hasActiveFilters =
    filters.type !== "all" || filters.status !== "all" || searchQuery;

  return (
    <div className="mb-4 space-y-3" style={{ marginTop: "-8px" }}>
      {/* Top Bar with Icons */}
      <div className="flex items-center gap-2">
        {/* Search Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            showSearch || searchQuery
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
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
              : "bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          }`}
          title="Filter loans"
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300 text-xs">Filtered</span>
              <button
                onClick={resetFilters}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Options */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200 space-y-3 bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
          {/* Type Filter */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
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
                ) // Only show due date filters if they have items
                .map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: key }))
                    }
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filters.status === key
                        ? key === "all"
                          ? "bg-slate-600 text-white"
                          : key === "active"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : key === "paid"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : key === "overdue"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                          : key === "due-soon"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-600 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
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
            <label className="block text-slate-300 text-sm font-medium mb-2">
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
                        ? "bg-slate-600 text-white"
                        : key === "active"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
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
              className="w-full p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Replace the DueDateWarning component (around line 2650-2750)
const DueDateWarning = ({ loans }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dueDateAnalysis = useMemo(() => {
    if (!loans || loans.length === 0)
      return { urgent: [], warning: [], count: 0 };

    const now = new Date();
    const urgent = []; // Overdue and due today
    const warning = []; // Due in 1-3 days

    loans.forEach((loan) => {
      // CHANGE: Only process loans that are active AND not paid
      if (loan.status !== "active" || !loan.dueDate || loan.status === "paid")
        return;

      // ADDITIONAL CHECK: Skip if remaining amount is 0 (effectively paid)
      const remainingAmount =
        parseFloat(loan.remainingAmount) || parseFloat(loan.amount) || 0;
      if (remainingAmount === 0) return;

      const dueDate = new Date(loan.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        urgent.push({ ...loan, daysOverdue: Math.abs(diffDays) });
      } else if (diffDays <= 3) {
        warning.push({ ...loan, daysLeft: diffDays });
      }
    });

    return {
      urgent: urgent.sort((a, b) => b.daysOverdue - a.daysOverdue),
      warning: warning.sort((a, b) => a.daysLeft - b.daysLeft),
      count: urgent.length + warning.length,
    };
  }, [loans]);

  if (dueDateAnalysis.count === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-3 rounded-xl border transition-all duration-200 ${
          dueDateAnalysis.urgent.length > 0
            ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15 animate-pulse"
            : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dueDateAnalysis.urgent.length > 0
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p
                className={`font-semibold text-sm ${
                  dueDateAnalysis.urgent.length > 0
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {dueDateAnalysis.urgent.length > 0 ? "Urgent!" : "Due Soon"}
              </p>
              <p className="text-slate-300 text-xs">
                {dueDateAnalysis.count} loan
                {dueDateAnalysis.count !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dueDateAnalysis.urgent.length > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium border border-red-500/30">
                {dueDateAnalysis.urgent.length} overdue
              </span>
            )}
            {dueDateAnalysis.warning.length > 0 && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium border border-amber-500/30">
                {dueDateAnalysis.warning.length} soon
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {dueDateAnalysis.urgent.map((loan, index) => (
            <div
              key={loan.id || index}
              className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-red-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 font-bold text-xs">
                      {loan.personName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {loan.personName}
                    </p>
                    <p className="text-red-400 text-xs">
                      {loan.daysOverdue === 0
                        ? "Due today"
                        : `${loan.daysOverdue} day${
                            loan.daysOverdue !== 1 ? "s" : ""
                          } overdue`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold text-sm">
                    ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                  </p>
                  <span className="text-red-400 text-xs px-2 py-0.5 bg-red-500/20 rounded-full">
                    {loan.type}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {dueDateAnalysis.warning.map((loan, index) => (
            <div
              key={loan.id || index}
              className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold text-xs">
                      {loan.personName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {loan.personName}
                    </p>
                    <p className="text-amber-400 text-xs">
                      Due in {loan.daysLeft} day{loan.daysLeft !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold text-sm">
                    ₱{(loan.remainingAmount || loan.amount).toLocaleString()}
                  </p>
                  <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-500/20 rounded-full">
                    {loan.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="w-8 h-8 text-white text-4xl font-bold flex items-center justify-center">
          ₱
        </span>
      </div>
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
    </div>
  </div>
);

// App Content Component
const AppContent = () => {
  const { loading } = useAuth();
  return loading ? <LoadingScreen /> : <LoanTrackerApp />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-6">
              Please refresh the page and try again
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root App Component
const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
