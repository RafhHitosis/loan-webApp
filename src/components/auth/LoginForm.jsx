import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
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
      // Don't reset form data here - let the auth state change handle navigation
    } catch (err) {
      console.error("Authentication error:", err);

      // Friendly error messages
      let errorMessage = err.message;

      if (errorMessage.includes("user-not-found")) {
        errorMessage = "No account found with this email";
      } else if (
        errorMessage.includes("wrong-password") ||
        errorMessage.includes("invalid-credential")
      ) {
        errorMessage = "Incorrect password";
      } else if (errorMessage.includes("email-already-in-use")) {
        errorMessage = "An account with this email already exists";
      } else if (errorMessage.includes("weak-password")) {
        errorMessage = "Password is too weak";
      } else if (errorMessage.includes("invalid-email")) {
        errorMessage = "Invalid email address";
      } else if (errorMessage.includes("too-many-requests")) {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (
        errorMessage.includes("user-disabled") ||
        errorMessage.includes("disabled by an administrator")
      ) {
        errorMessage =
          "Your account has been disabled. Please contact support.";
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
              setFormData({ email: "", password: "" }); // Clear form
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

export default LoginForm;
