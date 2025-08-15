const CLOUDINARY_UPLOAD_PRESET = "receipt_upload";
const CLOUDINARY_CLOUD_NAME = "dpiupmmsg";

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

export default cloudinaryService;
