import React, { useState, useRef } from "react";
import { Camera, Upload, X, Eye, Trash2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ProfileImageModal = ({
  isOpen,
  onClose,
  currentImage,
  onImageUpload,
  onImageDelete,
  isUploading,
}) => {
  const { colors } = useTheme();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = (file) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB");
      return;
    }

    setUploadError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    try {
      setUploadError("");
      await onImageUpload(fileInputRef.current.files[0]);
      setPreviewImage(null);
      onClose();
    } catch (error) {
      setUploadError(error.message || "Failed to upload image");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      setUploadError("");
      await onImageDelete();
      onClose();
    } catch (error) {
      setUploadError(error.message || "Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setPreviewImage(null);
    setUploadError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border ${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${colors.border.secondary}`}
        >
          <h2 className={`text-xl font-bold ${colors.text.primary}`}>
            Profile Picture
          </h2>
          <button
            onClick={handleClose}
            className={`w-10 h-10 rounded-full ${colors.background.elevated} ${colors.interactive.hover} flex items-center justify-center ${colors.text.tertiary} hover:${colors.text.secondary} transition-all duration-200`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Current Image Preview */}
          {currentImage && (
            <div className="space-y-4">
              <p className={`text-sm ${colors.text.tertiary} text-center`}>
                Current Picture
              </p>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={currentImage}
                    alt="Current profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/30"
                  />
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="absolute inset-0 bg-black/0 hover:bg-black/40 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 hover:opacity-100"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isUploading}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${colors.background.elevated}`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove Picture
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {!currentImage || !isDeleting ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"></div>
                <p className={`text-sm ${colors.text.tertiary} px-3`}>
                  {currentImage
                    ? "Upload New Picture"
                    : "Upload Profile Picture"}
                </p>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"></div>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : `${colors.border.primary} hover:border-emerald-500/50 ${colors.interactive.hover}`
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <div className="space-y-3">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-emerald-500"
                    />
                    <p className={`text-sm ${colors.text.primary} font-medium`}>
                      Ready to upload
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`w-12 h-12 rounded-full ${colors.background.elevated} flex items-center justify-center mx-auto`}
                    >
                      <Camera className={`w-6 h-6 ${colors.text.tertiary}`} />
                    </div>
                    <div>
                      <p className={`${colors.text.primary} font-medium`}>
                        Drop image here or click to browse
                      </p>
                      <p className={`text-xs ${colors.text.tertiary} mt-1`}>
                        Supports JPG, PNG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Error message */}
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                  {uploadError}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className={`flex gap-3 p-6 border-t ${colors.border.secondary}`}>
          <button
            onClick={handleClose}
            disabled={isUploading || isDeleting}
            className={`flex-1 px-4 py-3 rounded-xl border ${colors.border.primary} ${colors.text.secondary} ${colors.interactive.hover} font-medium transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          {previewImage && (
            <button
              onClick={handleUpload}
              disabled={isUploading || isDeleting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          )}
        </div>

        {/* Full Image Modal */}
        {showFullImage && currentImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-2xl max-h-[80vh] p-4">
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={currentImage}
                alt="Profile full view"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileImageModal;
