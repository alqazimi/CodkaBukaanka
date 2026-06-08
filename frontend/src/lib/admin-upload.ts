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

function parseUploadError(status: number, body: { error?: string; code?: string }): string {
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
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: url.startsWith("/") ? "same-origin" : "include",
    headers,
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
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

export async function uploadAdminEvidence(
  file: File,
  visibility: "PUBLIC" | "PRIVATE"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  if (file.size <= VERCEL_ADMIN_UPLOAD_MAX_BYTES) {
    return postUpload("/api/admin-proxy/upload", formData);
  }

  const authRes = await fetch("/api/admin/upload-auth", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const authBody = (await authRes.json().catch(() => ({}))) as UploadAuth & { error?: string };
  if (!authRes.ok || !authBody.uploadUrl || !authBody.accessToken) {
    throw new Error(
      authRes.status === 401
        ? "Your session expired. Sign in again, then retry the upload."
        : "Could not start a direct upload. Try a smaller file (under 4MB) or sign in again."
    );
  }

  return postUpload(authBody.uploadUrl, formData, {
    Authorization: `Bearer ${authBody.accessToken}`,
  });
}
