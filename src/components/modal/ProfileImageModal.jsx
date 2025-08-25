import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, Eye, Trash2, RotateCcw, Check } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ImageCropper = ({ image, onCropComplete, onCancel }) => {
  const { colors } = useTheme();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const containerHeight = 400;

      // Calculate scale to fit image in container
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
      setImageDimensions({
        width: img.width * newScale,
        height: img.height * newScale,
      });

      // Center crop area
      const minSize =
        Math.min(img.width * newScale, img.height * newScale) * 0.6;
      setCropArea({
        x: (img.width * newScale - minSize) / 2,
        y: (img.height * newScale - minSize) / 2,
        size: minSize,
      });
    };
    img.src = image;
  }, [image]);

  const getEventCoordinates = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback(
    (e, type) => {
      e.stopPropagation();

      // Only prevent default for touch events, not mouse events
      if (e.type.includes("touch")) {
        e.preventDefault();
      }

      const rect = containerRef.current.getBoundingClientRect();
      const coords = getEventCoordinates(e);
      const x = coords.x - rect.left;
      const y = coords.y - rect.top;

      if (type === "drag") {
        setIsDragging(true);
        setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      } else if (type === "resize") {
        setIsResizing(true);
        setDragStart({ x, y });
      }
    },
    [cropArea]
  );

  const handleMove = useCallback(
    (e) => {
      if (!isDragging && !isResizing) return;

      // Prevent default for touch events to stop scrolling
      if (e.type.includes("touch")) {
        e.preventDefault();
      }

      const rect = containerRef.current.getBoundingClientRect();
      const coords = getEventCoordinates(e);
      const x = coords.x - rect.left;
      const y = coords.y - rect.top;

      if (isDragging) {
        const newX = Math.max(
          0,
          Math.min(imageDimensions.width - cropArea.size, x - dragStart.x)
        );
        const newY = Math.max(
          0,
          Math.min(imageDimensions.height - cropArea.size, y - dragStart.y)
        );
        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        const centerX = cropArea.x + cropArea.size / 2;
        const centerY = cropArea.y + cropArea.size / 2;
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const newSize = Math.max(
          50,
          Math.min(
            Math.min(imageDimensions.width, imageDimensions.height),
            distance * 2
          )
        );

        const newX = Math.max(
          0,
          Math.min(imageDimensions.width - newSize, centerX - newSize / 2)
        );
        const newY = Math.max(
          0,
          Math.min(imageDimensions.height - newSize, centerY - newSize / 2)
        );

        setCropArea({ x: newX, y: newY, size: newSize });
      }
    },
    [isDragging, isResizing, dragStart, cropArea, imageDimensions]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Set up global event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      // Mouse events
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);

      // Touch events with passive: false to allow preventDefault
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, isResizing, handleMove, handleEnd]);

  const cropImage = useCallback(async () => {
    setIsProcessing(true);

    // Add a small delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const cropSize = 300; // Final output size
      canvas.width = cropSize;
      canvas.height = cropSize;

      // Calculate original coordinates
      const originalX = cropArea.x / scale;
      const originalY = cropArea.y / scale;
      const originalSize = cropArea.size / scale;

      // Draw cropped image
      ctx.drawImage(
        img,
        originalX,
        originalY,
        originalSize,
        originalSize,
        0,
        0,
        cropSize,
        cropSize
      );

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          onCropComplete(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    img.onerror = () => {
      setIsProcessing(false);
    };

    img.src = image;
  }, [image, cropArea, scale, onCropComplete]);

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>
          Crop Your Image
        </h3>
        <p className={`text-sm ${colors.text.tertiary}`}>
          Drag to move, resize from corners
        </p>
      </div>

      <div
        ref={containerRef}
        className={`relative mx-auto bg-black/20 rounded-lg overflow-hidden select-none transition-all duration-300 ${
          isProcessing ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{
          width: imageDimensions.width,
          height: imageDimensions.height,
          maxWidth: "100%",
          maxHeight: "400px",
          touchAction: "none",
        }}
      >
        <img
          src={image}
          alt="Crop preview"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            width: imageDimensions.width,
            height: imageDimensions.height,
          }}
          draggable={false}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        {/* Crop area */}
        <div
          className="absolute border-2 border-white shadow-lg cursor-move select-none"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.size,
            height: cropArea.size,
            backgroundColor: "transparent",
            touchAction: "none",
          }}
          onMouseDown={(e) => handleStart(e, "drag")}
          onTouchStart={(e) => handleStart(e, "drag")}
        >
          {/* Corner resize handles */}
          <div
            className="absolute w-6 h-6 bg-white border-2 border-gray-400 cursor-nw-resize -top-3 -left-3 rounded-full shadow-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
          />
          <div
            className="absolute w-6 h-6 bg-white border-2 border-gray-400 cursor-ne-resize -top-3 -right-3 rounded-full shadow-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
          />
          <div
            className="absolute w-6 h-6 bg-white border-2 border-gray-400 cursor-sw-resize -bottom-3 -left-3 rounded-full shadow-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
          />
          <div
            className="absolute w-6 h-6 bg-white border-2 border-gray-400 cursor-se-resize -bottom-3 -right-3 rounded-full shadow-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStart(e, "resize");
            }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 border border-white/30 pointer-events-none">
            <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
            <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
            <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
          </div>
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-white text-sm font-medium">
                Processing image...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 rounded-xl border ${colors.border.primary} ${colors.text.secondary} ${colors.interactive.hover} font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Back
        </button>
        <button
          onClick={cropImage}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed relative overflow-hidden ${
            isProcessing
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white/80"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
          }`}
        >
          {isProcessing ? (
            <>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            </>
          ) : (
            <>Crop Image</>
          )}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
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

    // Create preview and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setShowCropper(true);
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

  const handleCropComplete = async (croppedBlob) => {
    try {
      setUploadError("");
      await onImageUpload(croppedBlob);
      setSelectedImage(null);
      setShowCropper(false);
      onClose();
    } catch (error) {
      setUploadError(error.message || "Failed to upload image");
      setShowCropper(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    setSelectedImage(null);
    setShowCropper(false);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`${colors.background.card} backdrop-blur-xl border-t ${colors.border.primary} sm:border ${colors.border.primary} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col`}
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {showCropper ? (
            <ImageCropper
              image={selectedImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          ) : (
            <>
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
                        <p
                          className={`text-xs ${colors.text.tertiary} mt-1 text-emerald-400`}
                        >
                          You'll be able to crop your image after selection
                        </p>
                      </div>
                    </div>
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
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm animate-in slide-in-from-top-2 duration-200">
                      {uploadError}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Actions - Only show if not in cropper mode */}
        {!showCropper && (
          <div className={`flex gap-3 p-6 border-t ${colors.border.secondary}`}>
            <button
              onClick={handleClose}
              disabled={isUploading || isDeleting}
              className={`flex-1 px-4 py-3 rounded-xl border ${colors.border.primary} ${colors.text.secondary} ${colors.interactive.hover} font-medium transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
          </div>
        )}

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
