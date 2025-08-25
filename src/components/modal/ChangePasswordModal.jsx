import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const ChangePasswordModal = ({ isOpen, onClose, user }) => {
  const { colors } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Password validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) errors.push("At least 6 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    return errors;
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-amber-500";
    if (strength <= 3) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = (strength) => {
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    return "Strong";
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field errors
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // Clear success state
    if (success) setSuccess(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    // New password
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = `Password must have: ${passwordErrors.join(
          ", "
        )}`;
      }
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    // Check if new password is same as current
    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);

      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Password update error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/wrong-password") {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.code === "auth/weak-password") {
        setErrors({ newPassword: "Password is too weak" });
      } else if (error.code === "auth/requires-recent-login") {
        setErrors({
          general: "Please sign out and sign back in, then try again",
        });
      } else {
        setErrors({ general: error.message || "Failed to update password" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setSuccess(false);
    setShowPasswords({ current: false, new: false, confirm: false });
    onClose();
  };

  if (!isOpen) return null;

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border ${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300 shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>
              Change Password
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full ${colors.background.elevated} ${colors.interactive.hover} flex items-center justify-center ${colors.text.tertiary} hover:${colors.text.secondary} transition-all duration-200 disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className={`p-6 border-b ${colors.border.secondary}`}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">
                  Password Updated!
                </p>
                <p className={`text-sm ${colors.text.tertiary}`}>
                  Your password has been changed successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[60vh] overflow-y-auto"
        >
          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <label
              className={`block ${colors.text.secondary} text-sm font-medium`}
            >
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                disabled={isLoading || success}
                className={`w-full px-3 py-2.5 pr-12 ${
                  colors.background.elevated
                } border ${
                  errors.currentPassword
                    ? "border-red-500 bg-red-500/10"
                    : colors.border.primary
                } rounded-lg ${
                  colors.text.primary
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all duration-200 disabled:opacity-50`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                disabled={isLoading || success}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} hover:${colors.text.secondary} transition-colors disabled:opacity-50`}
              >
                {showPasswords.current ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-400 text-sm">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label
              className={`block ${colors.text.secondary} text-sm font-medium`}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                disabled={isLoading || success}
                className={`w-full px-3 py-2.5 pr-12 ${
                  colors.background.elevated
                } border ${
                  errors.newPassword
                    ? "border-red-500 bg-red-500/10"
                    : colors.border.primary
                } rounded-lg ${
                  colors.text.primary
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all duration-200 disabled:opacity-50`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                disabled={isLoading || success}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} hover:${colors.text.secondary} transition-colors disabled:opacity-50`}
              >
                {showPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${colors.text.tertiary}`}>
                    Password strength:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength <= 1
                        ? "text-red-400"
                        : passwordStrength <= 2
                        ? "text-amber-400"
                        : passwordStrength <= 3
                        ? "text-blue-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {getStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                        level <= passwordStrength
                          ? getStrengthColor(passwordStrength)
                          : `${colors.background.elevated} opacity-30`
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="text-red-400 text-sm">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label
              className={`block ${colors.text.secondary} text-sm font-medium`}
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                disabled={isLoading || success}
                className={`w-full px-3 py-2.5 ${
                  formData.confirmPassword &&
                  formData.newPassword === formData.confirmPassword
                    ? "pr-20"
                    : "pr-12"
                } ${colors.background.elevated} border ${
                  errors.confirmPassword
                    ? "border-red-500 bg-red-500/10"
                    : formData.confirmPassword &&
                      formData.newPassword === formData.confirmPassword
                    ? "border-emerald-500 bg-emerald-500/10"
                    : colors.border.primary
                } rounded-lg ${
                  colors.text.primary
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all duration-200 disabled:opacity-50`}
                placeholder="Confirm new password"
              />

              {/* Match indicator */}
              {formData.confirmPassword && formData.newPassword && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                disabled={isLoading || success}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary} hover:${colors.text.secondary} transition-colors disabled:opacity-50`}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Security Tips */}
          <div
            className={`p-4 rounded-xl ${colors.background.elevated} border ${colors.border.secondary}`}
          >
            <div className="flex items-start gap-3">
              <Shield
                className={`w-5 h-5 ${colors.text.tertiary} mt-0.5 flex-shrink-0`}
              />
              <div className="space-y-1">
                <p className={`text-sm font-medium ${colors.text.secondary}`}>
                  Password Tips:
                </p>
                <ul className={`text-xs ${colors.text.tertiary} space-y-1`}>
                  <li>
                    • Use a mix of uppercase, lowercase, numbers, and symbols
                  </li>
                  <li>• Make it at least 8 characters long</li>
                  <li>• Avoid common words or personal information</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className={`flex gap-3 p-6 border-t ${colors.border.secondary}`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl border ${colors.border.primary} ${colors.text.secondary} ${colors.interactive.hover} font-medium transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              isLoading ||
              success ||
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword
            }
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Updating...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Updated!
              </>
            ) : (
              <>Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
