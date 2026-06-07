"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  clearContactFormStartedAt,
  msUntilContactFormSubmit,
  readContactFormStartedAt,
} from "@/lib/contact-form-timing";

export function ContactForm({ type = "contact" }: { type?: "contact" | "correction" }) {
  const t = useTranslations("form");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [startedAt] = useState(() => readContactFormStartedAt(type));
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    const waitMs = msUntilContactFormSubmit(startedAt);
    if (waitMs === 0) {
      setCanSubmit(true);
      return;
    }
    const timer = window.setTimeout(() => setCanSubmit(true), waitMs);
    return () => window.clearTimeout(timer);
  }, [startedAt]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      setStatus("error");
      setErrorText(t("waitBeforeSubmit"));
      return;
    }

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
      setErrorText(t("nameTooShort"));
      return;
    }
    if (!payload.email.includes("@")) {
      setStatus("error");
      setErrorText(t("emailInvalid"));
      return;
    }
    if (type === "contact" && (payload.subject?.length ?? 0) < 2) {
      setStatus("error");
      setErrorText(t("subjectTooShort"));
      return;
    }
    if (payload.message.length < 10) {
      setStatus("error");
      setErrorText(t("messageTooShort"));
      return;
    }

    const endpoint = type === "correction" ? "/api/public/corrections" : "/api/public/contact";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });

    if (res.ok) {
      clearContactFormStartedAt(type);
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
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-6 font-medium text-white/90">
        {t("success")}
      </div>
    );
  }

  const labelClass = "mb-1.5 block text-sm font-semibold text-white/85";
  const fieldClass = "input-base";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>{t("name")}</label>
        <input name="name" required autoComplete="name" className={fieldClass} />
      </div>
      <div>
        <label className={labelClass}>{t("email")}</label>
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
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
        <p className="text-sm font-medium text-red-300" role="alert">
          {errorText || t("error")}
        </p>
      )}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <input type="hidden" name="startedAt" value={startedAt} />
      <Button type="submit" disabled={status === "loading" || !canSubmit}>
        {status === "loading" ? t("sending") : !canSubmit ? t("preparing") : t("submit")}
      </Button>
    </form>
  );
}
