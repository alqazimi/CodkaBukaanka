import { v2 as cloudinary } from "cloudinary";

function readCloudinaryEnv() {
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "",
    api_key: process.env.CLOUDINARY_API_KEY?.trim() ?? "",
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim() ?? "",
  };
}

export function applyCloudinaryConfig(): boolean {
  const { cloud_name, api_key, api_secret } = readCloudinaryEnv();
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return true;
}

applyCloudinaryConfig();

export { cloudinary };

export function isCloudinaryConfigured(): boolean {
  const { cloud_name, api_key, api_secret } = readCloudinaryEnv();
  return Boolean(cloud_name && api_key && api_secret);
}

/** User-safe message from Cloudinary SDK / API errors (no secrets). */
export function formatCloudinaryError(error: unknown): string {
  if (!error) return "Cloudinary upload failed";
  if (typeof error === "string") return error.slice(0, 300);
  if (error instanceof Error && error.message) return error.message.slice(0, 300);

  const record = error as {
    message?: string;
    http_code?: number;
    error?: { message?: string };
  };
  const message = record.error?.message ?? record.message;
  if (message) {
    const code = record.http_code ? ` (HTTP ${record.http_code})` : "";
    return `${message}${code}`.slice(0, 300);
  }
  return "Cloudinary upload failed";
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

type UploadOptions = {
  folder?: string;
  resource_type?: "image" | "video" | "raw";
  accessType?: "public" | "authenticated";
};

function uploadStreamOnce(
  buffer: Buffer,
  options: UploadOptions & { access_mode?: "public" | "authenticated" }
): Promise<{ url: string; publicId: string; bytes: number; format?: string }> {
  return new Promise((resolve, reject) => {
    const isPrivate = options.accessType === "authenticated";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "diiwaanka-bukaanka",
        resource_type: options.resource_type ?? "auto",
        type: "upload",
        ...(options.access_mode ? { access_mode: options.access_mode } : {}),
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
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
    );
    uploadStream.end(buffer);
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions
): Promise<{ url: string; publicId: string; bytes: number; format?: string }> {
  if (!applyCloudinaryConfig()) {
    throw new Error("Cloudinary is not configured");
  }

  const isPrivate = options.accessType === "authenticated";

  try {
    if (isPrivate) {
      return await uploadStreamOnce(buffer, { ...options, access_mode: "authenticated" });
    }
    return await uploadStreamOnce(buffer, options);
  } catch (firstError) {
    if (!isPrivate) throw firstError;
    // Some Cloudinary plans reject authenticated access_mode — fall back to standard upload.
    return uploadStreamOnce(buffer, { ...options, accessType: "public" });
  }
}
