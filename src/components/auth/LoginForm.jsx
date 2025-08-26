import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import Input from "../common/Input";
import Button from "../common/Button";
import ErrorMessage from "./../indicators/ErrorMessage";

const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();

  // Enhanced email validation
  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }

    if (email.length > 254) {
      return "Email address is too long";
    }

    return null;
  };

  // Enhanced password validation
  const validatePassword = (password, isSignUpMode = false) => {
    if (!password) {
      return "Password is required";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    if (password.length > 128) {
      return "Password is too long (maximum 128 characters)";
    }

    if (isSignUpMode) {
      if (!/(?=.*[a-z])/.test(password)) {
        return "Password must contain at least one lowercase letter";
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        return "Password must contain at least one uppercase letter";
      }
      if (!/(?=.*\d)/.test(password)) {
        return "Password must contain at least one number";
      }
      if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
        return "Password must contain at least one special character";
      }
    }

    return null;
  };

  // Comprehensive Firebase error mapping
  const mapFirebaseError = (error) => {
    // Prevent console logging by suppressing the original error
    const errorCode = error?.code || "";
    const errorMessage = error?.message || "";

    // Authentication errors
    if (
      errorCode.includes("user-not-found") ||
      errorMessage.includes("user-not-found")
    ) {
      return "No account found with this email address";
    }

    if (
      errorCode.includes("wrong-password") ||
      errorCode.includes("invalid-credential") ||
      errorMessage.includes("wrong-password") ||
      errorMessage.includes("invalid-credential")
    ) {
      return "Incorrect email or password";
    }

    if (
      errorCode.includes("invalid-email") ||
      errorMessage.includes("invalid-email")
    ) {
      return "Please enter a valid email address";
    }

    if (
      errorCode.includes("user-disabled") ||
      errorMessage.includes("user-disabled")
    ) {
      return "This account has been disabled. Please contact support";
    }

    if (
      errorCode.includes("email-already-in-use") ||
      errorMessage.includes("email-already-in-use")
    ) {
      return "An account with this email already exists";
    }

    if (
      errorCode.includes("weak-password") ||
      errorMessage.includes("weak-password")
    ) {
      return "Password is too weak. Please choose a stronger password";
    }

    // Rate limiting and security errors
    if (
      errorCode.includes("too-many-requests") ||
      errorMessage.includes("too-many-requests")
    ) {
      return "Too many failed attempts. Please try again in a few minutes";
    }

    if (
      errorCode.includes("requires-recent-login") ||
      errorMessage.includes("requires-recent-login")
    ) {
      return "Please sign out and sign in again to continue";
    }

    // Network and connection errors
    if (
      errorCode.includes("network-request-failed") ||
      errorMessage.includes("network")
    ) {
      return "Network error. Please check your connection and try again";
    }

    if (errorCode.includes("timeout") || errorMessage.includes("timeout")) {
      return "Request timed out. Please try again";
    }

    // Configuration errors
    if (
      errorCode.includes("api-key-not-valid") ||
      errorMessage.includes("api-key")
    ) {
      return "Service temporarily unavailable. Please try again later";
    }

    if (
      errorCode.includes("app-not-authorized") ||
      errorMessage.includes("not-authorized")
    ) {
      return "Service temporarily unavailable. Please try again later";
    }

    // Quota and limits
    if (
      errorCode.includes("quota-exceeded") ||
      errorMessage.includes("quota")
    ) {
      return "Service temporarily unavailable due to high demand. Please try again later";
    }

    // Token and session errors
    if (
      errorCode.includes("invalid-id-token") ||
      errorMessage.includes("token")
    ) {
      return "Session expired. Please try signing in again";
    }

    // Generic fallback for unknown errors
    if (errorMessage.includes("Firebase") || errorMessage.includes("auth/")) {
      return "Authentication failed. Please try again";
    }

    // Last resort fallback
    return "Something went wrong. Please try again";
  };

  // Enhanced form submission with comprehensive error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Client-side validation
      const emailError = validateEmail(formData.email);
      if (emailError) {
        setError(emailError);
        return;
      }

      const passwordError = validatePassword(formData.password, isSignUp);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = formData.email.trim().toLowerCase();
      const sanitizedPassword = formData.password;

      // Additional security checks
      if (sanitizedEmail.length === 0 || sanitizedPassword.length === 0) {
        setError("Please fill in all required fields");
        return;
      }

      // Attempt authentication with proper error handling
      if (isSignUp) {
        await signUp(sanitizedEmail, sanitizedPassword);
      } else {
        await signIn(sanitizedEmail, sanitizedPassword);
      }

      // Success - clear form and error
      setError("");
    } catch (err) {
      // Suppress console error logging
      const userFriendlyError = mapFirebaseError(err);
      setError(userFriendlyError);

      // Optional: Log sanitized error for debugging (remove in production)
      // console.debug("Auth error occurred:", { code: err?.code, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced form data update with validation
  const updateFormData = (field, value) => {
    // Sanitize input based on field type
    let sanitizedValue = value;

    if (field === "email") {
      // Remove leading/trailing whitespace and convert to lowercase
      sanitizedValue = value.trim().toLowerCase();

      // Prevent obvious invalid characters
      if (/[<>{}\\]/.test(sanitizedValue)) {
        return; // Don't update if contains invalid characters
      }
    }

    if (field === "password") {
      // Prevent extremely long passwords during typing
      if (value.length > 128) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  // Enhanced form reset
  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setError("");
    setShowPassword(false);
  };

  // Toggle between sign in and sign up
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div
      className={`min-h-screen ${colors.background.primary} flex flex-col relative overflow-hidden`}
    >
      {/* Enhanced glassy background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-emerald-500/20 to-emerald-700/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-emerald-300/10 to-emerald-500/10 rounded-full blur-3xl animate-spin"></div>

        {/* Glass reflection effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/3 to-transparent"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="relative mb-6 group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400/90 to-emerald-600/90 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/20 transform transition-all duration-300 hover:scale-110 hover:rotate-3 group-hover:shadow-emerald-500/25 group-hover:shadow-2xl">
                <span className="text-white text-3xl font-bold transition-transform duration-300 group-hover:scale-110 drop-shadow-lg">
                  ₱
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400/80 backdrop-blur-sm rounded-full animate-ping opacity-75 border border-white/30"></div>
            </div>

            <div className="space-y-2">
              <h1
                className={`text-3xl font-bold ${colors.text.primary} tracking-tight transition-all duration-300`}
              >
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p
                className={`${colors.text.secondary} text-sm transition-colors duration-300`}
              >
                {isSignUp
                  ? "Join us to get started"
                  : "Sign in to your account"}
              </p>
            </div>
          </div>

          {/* Glassy form container */}
          <div
            className={`${colors.background.card}/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border ${colors.border.primary}/30 border-white/10 transform transition-all duration-500 hover:shadow-emerald-500/10 hover:shadow-2xl relative overflow-hidden`}
          >
            {/* Glass overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            <div className="relative z-10">
              <ErrorMessage error={error} />

              <form
                onSubmit={handleSubmit}
                className="space-y-5 mt-5"
                noValidate
              >
                {/* Email Input */}
                <div className="relative group">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    icon={Mail}
                    error={
                      error &&
                      (error.toLowerCase().includes("email") ||
                        error.toLowerCase().includes("account"))
                    }
                    variant="default"
                    className="backdrop-blur-md border-white/10 hover:border-white/20 focus:shadow-lg focus:shadow-emerald-500/10 focus:scale-102 transition-all duration-300 text-sm py-3.5"
                    required
                    autoComplete="email"
                    maxLength="254"
                  />
                  {/* Glass reflection on input */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl pointer-events-none"></div>
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    icon={Lock}
                    error={error && error.toLowerCase().includes("password")}
                    variant="default"
                    className="backdrop-blur-md border-white/10 hover:border-white/20 focus:shadow-lg focus:shadow-emerald-500/10 focus:scale-102 transition-all duration-300 text-sm py-3.5 pr-12"
                    required
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    maxLength="128"
                  />
                  {/* Glass reflection on input */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl pointer-events-none"></div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} transition-all duration-300 hover:text-emerald-400 hover:scale-125 p-1 rounded-full hover:bg-emerald-500/20 backdrop-blur-sm z-20`}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 transition-transform duration-300 drop-shadow-sm" />
                    ) : (
                      <Eye className="w-4 h-4 transition-transform duration-300 drop-shadow-sm" />
                    )}
                  </button>
                </div>

                {/* Glassy Submit Button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    disabled={
                      loading || !formData.email.trim() || !formData.password
                    }
                    variant="primary"
                    size="md"
                    className="w-full backdrop-blur-md border border-white/20 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    {/* Enhanced button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                    <div className="relative z-10 flex items-center">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 backdrop-blur-sm"></div>
                          <span className="animate-pulse drop-shadow-sm text-sm font-semibold">
                            {isSignUp ? "Creating..." : "Signing in..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="transition-transform duration-300 group-hover:scale-105 drop-shadow-sm text-md font-semibold">
                            {isSignUp ? "Create Account" : "Sign In"}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-2 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 drop-shadow-sm" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </form>

              {/* Glassy Toggle section */}
              <div className="mt-6 pt-5 border-t border-white/10 text-center relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <p
                  className={`${colors.text.secondary} text-sm mb-3 transition-colors duration-300 drop-shadow-sm`}
                >
                  {isSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-all duration-300 hover:scale-105 hover:underline decoration-2 underline-offset-2 transform hover:-translate-y-0.5 drop-shadow-sm backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
