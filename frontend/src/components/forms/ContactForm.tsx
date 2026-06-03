"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { getApiBaseUrl } from "@/lib/api";

export function ContactForm({ type = "contact" }: { type?: "contact" | "correction" }) {
  const t = useTranslations("form");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [startedAt] = useState(() => Date.now().toString());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorText("");
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form)) as Record<string, FormDataEntryValue>;

    const payload: Record<string, string> = {
      name: String(raw.name ?? "").trim(),
      email: String(raw.email ?? "").trim(),
      message: String(raw.message ?? "").trim(),
      website: String(raw.website ?? "").trim(),
      startedAt: String(raw.startedAt ?? startedAt).trim(),
    };
    if (type === "contact") {
      payload.subject = String(raw.subject ?? "").trim();
    } else {
      const reportSlug = String(raw.reportSlug ?? "").trim();
      if (reportSlug) payload.reportSlug = reportSlug;
    }

    if (payload.name.length < 2) {
      setStatus("error");
      setErrorText("Name must be at least 2 characters.");
      return;
    }
    if (!payload.email.includes("@")) {
      setStatus("error");
      setErrorText("Please enter a valid email address.");
      return;
    }
    if (type === "contact" && (payload.subject?.length ?? 0) < 2) {
      setStatus("error");
      setErrorText("Subject must be at least 2 characters.");
      return;
    }
    if (payload.message.length < 10) {
      setStatus("error");
      setErrorText("Message must be at least 10 characters.");
      return;
    }

    const endpoint = type === "correction" ? "/api/corrections" : "/api/contact";
    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus("success");
      form.reset();
      return;
    }
    let apiError = "";
    try {
      const body = (await res.json()) as { error?: string };
      apiError = body.error ?? "";
    } catch {
      apiError = "";
    }
    setStatus("error");
    setErrorText(apiError || t("error"));
    if (res.ok) form.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-teal-800 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-200">
        {t("success")}
      </div>
    );
  }

  const labelClass = "mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300";
  const fieldClass = "input-base";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>{t("name")}</label>
        <input name="name" required className={fieldClass} />
      </div>
      <div>
        <label className={labelClass}>{t("email")}</label>
        <input name="email" type="email" required className={fieldClass} />
      </div>
      {type === "contact" ? (
        <div>
          <label className={labelClass}>{t("subject")}</label>
          <input name="subject" required className={fieldClass} />
        </div>
      ) : (
        <div>
          <label className={labelClass}>{t("reportRef")}</label>
          <input name="reportSlug" className={fieldClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>{t("message")}</label>
        <textarea name="message" required rows={5} className={fieldClass} />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorText || t("error")}
        </p>
      )}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input type="hidden" name="startedAt" value={startedAt} />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "..." : t("submit")}
      </Button>
    </form>
  );
}
