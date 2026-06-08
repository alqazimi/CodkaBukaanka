import { mapAdminApiError } from "@/lib/login-error-message";

/** Vercel serverless request body limit — larger admin uploads go direct to Railway. */
export const VERCEL_ADMIN_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

type UploadAuth = {
  uploadUrl: string;
  accessToken: string;
};

type UploadResult = {
  url: string;
  publicId: string;
  type: string;
  visibility?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
};

function parseUploadError(status: number, body: { error?: string; code?: string; detail?: string }): string {
  if (body.code === "cloudinary_failed") {
    const detail = body.detail?.trim();
    if (detail) {
      if (/invalid api key|unknown api key|401|unauthorized/i.test(detail)) {
        return "Cloudinary API key or secret is wrong. Copy API Key and API Secret again from cloudinary.com/console → Dashboard.";
      }
      if (/cloud name|cloud_name|not found/i.test(detail)) {
        return "Cloudinary cloud name is wrong. Copy Cloud name from cloudinary.com/console → Dashboard into Railway CLOUDINARY_CLOUD_NAME.";
      }
      return `Cloudinary rejected the file: ${detail}`;
    }
    return mapAdminApiError(status, body.error ?? null, body.code);
  }
  return mapAdminApiError(
    status,
    typeof body.error === "string" ? body.error : null,
    typeof body.code === "string" ? body.code : undefined
  );
}

async function postUpload(
  url: string,
  formData: FormData,
  headers: Record<string, string> = {}
): Promise<UploadResult> {
  const isCrossOrigin = url.startsWith("http://") || url.startsWith("https://");

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: isCrossOrigin ? "omit" : "same-origin",
    headers,
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    detail?: string;
    url?: string;
    publicId?: string;
    type?: string;
    visibility?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  };

  if (!res.ok) {
    throw new Error(parseUploadError(res.status, body));
  }

  if (!body.url || !body.publicId || !body.type) {
    throw new Error("Upload succeeded but the server returned an incomplete response.");
  }

  return body as UploadResult;
}

async function fetchUploadAuth(): Promise<UploadAuth | null> {
  const authRes = await fetch("/api/admin/upload-auth", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const authBody = (await authRes.json().catch(() => ({}))) as UploadAuth & { error?: string };
  if (!authRes.ok || !authBody.uploadUrl || !authBody.accessToken) {
    return null;
  }

  return { uploadUrl: authBody.uploadUrl, accessToken: authBody.accessToken };
}

export async function uploadAdminEvidence(
  file: File,
  visibility: "PUBLIC" | "PRIVATE"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  const auth = await fetchUploadAuth();
  if (auth) {
    try {
      return await postUpload(auth.uploadUrl, formData, {
        Authorization: `Bearer ${auth.accessToken}`,
      });
    } catch (directError) {
      if (file.size > VERCEL_ADMIN_UPLOAD_MAX_BYTES) {
        throw directError;
      }
      // Fall back to same-origin proxy for small files if direct upload fails (e.g. CORS during rollout).
    }
  }

  if (file.size > VERCEL_ADMIN_UPLOAD_MAX_BYTES) {
    throw new Error(
      "Your session expired or direct upload is unavailable. Sign in again, then retry files over 4MB."
    );
  }

  return postUpload("/api/admin-proxy/upload", formData);
}
