"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";

export function MediaUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setMessage("");

    try {
      const upload = await clientApi.upload(file, token);
      const type = file.type.startsWith("video/") ? "VIDEO" : file.type === "application/pdf" ? "PDF" : "IMAGE";
      await clientApi.post(
        "/api/admin/media",
        { type, url: upload.url, publicId: upload.publicId, mimeType: upload.mimeType, size: upload.bytes, title: file.name },
        token
      );
      setMessage("Uploaded successfully");
      refreshAdminPage(router);
    } catch {
      setMessage("Upload failed. Check backend and Cloudinary configuration.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-navy-300 bg-white p-6">
      <label className="block cursor-pointer text-center">
        <span className="text-sm font-medium text-teal-700">
          {uploading ? "Uploading..." : "Click to upload image, video, or PDF (max 10MB)"}
        </span>
        <input type="file" className="hidden" accept="image/*,video/mp4,video/webm,application/pdf" onChange={handleUpload} disabled={uploading} />
      </label>
      {message && <p className="mt-2 text-center text-sm text-navy-600">{message}</p>}
    </div>
  );
}
