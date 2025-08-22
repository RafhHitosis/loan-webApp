import React, { useState, useEffect } from "react";
import { Camera, Edit3, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { ref, set, get } from "firebase/database";
import { database } from "../.././lib/firebase";
import cloudinaryService from "../../services/cloudinaryService";
import ProfileImageModal from "../modal/ProfileImageModal";
import ChangePasswordModal from "../modal/ChangePasswordModal";

const Profile = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // State management
  const [profileImage, setProfileImage] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.uid) return;

      try {
        const profileRef = ref(database, `users/${user.uid}/profile`);
        const snapshot = await get(profileRef);

        if (snapshot.exists()) {
          const profileData = snapshot.val();
          setProfileImage(profileData.profileImage || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Handle profile image upload
  const handleImageUpload = async (file) => {
    if (!file || !user?.uid) return;

    setIsUploadingImage(true);
    try {
      // Delete old image if exists
      if (profileImage) {
        await handleImageDelete(false); // Don't update state yet
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(file);
      const imageUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;

      // Save to Firebase Database
      const profileRef = ref(database, `users/${user.uid}/profile`);
      await set(profileRef, {
        profileImage: imageUrl,
        profileImagePublicId: publicId,
        updatedAt: new Date().toISOString(),
      });

      setProfileImage(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle profile image deletion
  const handleImageDelete = async (updateState = true) => {
    if (!user?.uid) return;

    try {
      // Get current profile data to get publicId
      const profileRef = ref(database, `users/${user.uid}/profile`);
      const snapshot = await get(profileRef);

      if (snapshot.exists()) {
        const profileData = snapshot.val();
        const publicId = profileData.profileImagePublicId;

        // Delete from Cloudinary
        if (publicId) {
          await cloudinaryService.deleteImage(publicId);
        }

        // Update Firebase Database
        await set(profileRef, {
          profileImage: "",
          profileImagePublicId: "",
          updatedAt: new Date().toISOString(),
        });

        if (updateState) {
          setProfileImage("");
        }
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  };

  // Get user initials for default avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div
        className={`${colors.background.card} backdrop-blur-xl border ${colors.border.primary} rounded-2xl p-8 shadow-xl`}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Profile Picture Section */}
          <div className="relative group">
            <div
              className={`w-32 h-32 rounded-full border-4 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/30`}
            >
              {isLoadingProfile ? (
                <div
                  className={`w-full h-full ${colors.background.elevated} animate-pulse flex items-center justify-center`}
                >
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                  onClick={() => setShowImageModal(true)}
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center cursor-pointer`}
                >
                  <span className="text-white text-4xl font-bold">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>

            {/* Camera overlay */}
            <button
              onClick={() => setShowImageModal(true)}
              disabled={isUploadingImage}
              className={`absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-emerald-500/50`}
            >
              {isUploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* User Info */}
          <div className="space-y-2">
            <p className={`${colors.text.secondary} text-lg`}>{user?.email}</p>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.background.elevated} ${colors.text.tertiary} text-sm`}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Account Active
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div
        className={`${colors.background.card} backdrop-blur-xl border ${colors.border.primary} rounded-2xl p-6 shadow-xl`}
      >
        <h2
          className={`text-xl font-semibold ${colors.text.primary} mb-6 flex items-center gap-3`}
        >
          Account Settings
        </h2>

        <div className="space-y-4">
          {/* Change Password */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`w-full p-4 rounded-xl border ${colors.border.primary} ${colors.interactive.hover} transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <h3
                    className={`font-medium ${colors.text.primary} group-hover:text-emerald-400 transition-colors`}
                  >
                    Change Password
                  </h3>
                  <p className={`text-sm ${colors.text.tertiary}`}>
                    Update your account password
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Stats */}
      <div
        className={`${colors.background.card} backdrop-blur-xl border ${colors.border.primary} rounded-2xl p-6 shadow-xl`}
      >
        <h2 className={`text-xl font-semibold ${colors.text.primary} mb-6`}>
          Account Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-xl ${colors.background.elevated} border ${colors.border.secondary}`}
          >
            <p className={`text-sm ${colors.text.tertiary} mb-1`}>
              Member Since
            </p>
            <p className={`font-semibold ${colors.text.primary}`}>
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                    }
                  )
                : "Unknown"}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl ${colors.background.elevated} border ${colors.border.secondary}`}
          >
            <p className={`text-sm ${colors.text.tertiary} mb-1`}>
              Last Sign In
            </p>
            <p className={`font-semibold ${colors.text.primary}`}>
              {user?.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        currentImage={profileImage}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
        isUploading={isUploadingImage}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />
    </div>
  );
};

export default Profile;
