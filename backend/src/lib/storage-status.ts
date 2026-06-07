import { isCloudinaryConfigured } from "./cloudinary.js";
import { canUseLocalStorage, shouldPreferLocalUploads } from "./local-upload.js";

export function getStorageStatus() {
  const cloudinaryConfigured = isCloudinaryConfigured();
  const preferLocalUploads = shouldPreferLocalUploads();
  const isProduction = process.env.NODE_ENV === "production";
  const localStorageAvailable = canUseLocalStorage();
  const uploadsReady =
    cloudinaryConfigured || (preferLocalUploads && localStorageAvailable);

  let message: string | null = null;
  if (!uploadsReady) {
    message = isProduction
      ? "Cloudinary is not configured on Railway. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, then redeploy."
      : "File storage is not configured. Set CLOUDINARY_* in backend/.env or enable local uploads for development.";
  } else if (isProduction && !cloudinaryConfigured) {
    message =
      "Production is using temporary disk storage. Set USE_LOCAL_UPLOADS=false and configure Cloudinary so evidence survives redeploys.";
  }

  return {
    cloudinaryConfigured,
    preferLocalUploads,
    isProduction,
    uploadsReady,
    message,
  };
}
