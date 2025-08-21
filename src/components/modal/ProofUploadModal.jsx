import React, { useState, useEffect } from "react";
import cloudinaryService from "../../services/cloudinaryService";
import ErrorMessage from "../indicators/ErrorMessage";
import Button from "../common/Button";
import { X, Camera, Eye } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ProofUploadModal = ({ loan, open, onClose, onUpload }) => {
  const { colors, isDarkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setPaymentAmount("");
      setSelectedFile(null);
      setPreview("");
      setError("");
      setShowPreview(false);
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

    // Prevent double submission
    if (uploading) return;

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

      const result = await onUpload({
        amount: amount,
        proofUrl: uploadResult.secure_url,
        proofPublicId: uploadResult.public_id,
      });

      // Only close if upload was successful
      if (result && result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setError(`Failed to upload proof: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  // Theme-aware styles
  const inputClasses = `w-full pl-8 pr-4 py-3 ${colors.background.elevated} ${colors.border.primary} rounded-xl ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200`;
  const placeholderClasses = isDarkMode
    ? "placeholder-slate-400"
    : "placeholder-gray-500";
  const dropzoneClasses = `border-2 border-dashed ${colors.border.secondary} rounded-xl p-6 text-center ${colors.interactive.hover} transition-all duration-200`;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
        <div
          className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border ${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300 shadow-2xl`}
        >
          <div
            className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
          >
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>
              Upload Proof of Payment
            </h2>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full ${colors.background.elevated} ${colors.interactive.hover} flex items-center justify-center ${colors.text.tertiary} hover:${colors.text.secondary} transition-all duration-200`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="p-6 space-y-5">
            <ErrorMessage error={error} onClose={() => setError("")} />

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Payment Amount (Max: ₱
                {(loan?.remainingAmount || 0).toLocaleString()})
              </label>
              <div className="relative">
                <span
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary}`}
                >
                  ₱
                </span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    if (error) setError("");
                  }}
                  className={`${inputClasses} ${placeholderClasses}`}
                  placeholder="0.00"
                  min="0"
                  max={loan?.remainingAmount || 0}
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block ${colors.text.secondary} text-sm font-medium mb-2`}
              >
                Upload Proof
              </label>
              <div className={dropzoneClasses}>
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
                      {/* Preview button */}
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
                      <Camera
                        className={`w-12 h-12 ${colors.text.tertiary} mx-auto mb-3`}
                      />
                      <p className={`${colors.text.tertiary} text-sm`}>
                        Click to select image
                      </p>
                    </>
                  )}
                </label>
              </div>
              {selectedFile && (
                <p className={`text-xs ${colors.text.muted} mt-2`}>
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
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

      {/* Image Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] m-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 bg-black/60 rounded-lg px-3 py-2">
              <p className="text-white text-sm font-medium">
                {selectedFile?.name}
              </p>
              <p className="text-gray-300 text-xs">
                {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                MB
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProofUploadModal;
