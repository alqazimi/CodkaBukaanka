import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function isCloudinaryPrivateAsset(publicId: string | null | undefined): boolean {
  return Boolean(publicId && !publicId.startsWith("local/"));
}

export function signPrivateCloudinaryUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
  ttlSec = 3600
): string | null {
  if (!isCloudinaryConfigured() || publicId.startsWith("local/")) return null;
  try {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: "authenticated",
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + ttlSec,
    });
  } catch {
    return null;
  }
}

export function resolveEvidenceDeliveryUrl(
  storedUrl: string,
  publicId: string | null | undefined,
  visibility: "PUBLIC" | "PRIVATE",
  mimeType?: string | null
): string {
  if (!publicId || publicId.startsWith("local/")) return storedUrl;
  if (visibility !== "PRIVATE") return storedUrl;

  const resourceType = mimeType?.startsWith("video/")
    ? "video"
    : mimeType?.startsWith("image/")
      ? "image"
      : "raw";
  return signPrivateCloudinaryUrl(publicId, resourceType) ?? storedUrl;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: "image" | "video" | "raw";
    accessType?: "public" | "authenticated";
  }
): Promise<{ url: string; publicId: string; bytes: number; format?: string }> {
  return new Promise((resolve, reject) => {
    const isImage = options.resource_type === "image";
    const isPrivate = options.accessType === "authenticated";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "diiwaanka-bukaanka",
        resource_type: options.resource_type ?? "auto",
        type: isPrivate ? "authenticated" : "upload",
        ...(isImage
          ? {
              transformation: [
                { width: 1920, height: 1920, crop: "limit", quality: "auto:good", fetch_format: "auto" },
              ],
            }
          : {}),
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else {
          const publicId = result.public_id;
          const url = isPrivate
            ? signPrivateCloudinaryUrl(publicId, options.resource_type ?? "image") ?? result.secure_url
            : result.secure_url;
          resolve({
            url,
            publicId,
            bytes: result.bytes,
            format: result.format,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}
