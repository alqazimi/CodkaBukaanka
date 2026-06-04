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

export async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder?: string; resource_type?: "image" | "video" | "raw" }
): Promise<{ url: string; publicId: string; bytes: number; format?: string }> {
  return new Promise((resolve, reject) => {
    const isImage = options.resource_type === "image";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "diiwaanka-bukaanka",
        resource_type: options.resource_type ?? "auto",
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
        else
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format,
          });
      }
    );
    uploadStream.end(buffer);
  });
}
