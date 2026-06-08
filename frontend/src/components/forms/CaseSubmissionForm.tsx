"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  WHAT_WENT_WRONG,
  WHAT_WENT_WRONG_LABELS,
} from "@/lib/constants";
import {
  clearContactFormStartedAt,
  msUntilContactFormSubmit,
  readContactFormStartedAt,
} from "@/lib/contact-form-timing";
import { translatePublicFormError } from "@/lib/public-form-errors";
import {
  PublicEvidenceUpload,
  type SelectedEvidenceFile,
} from "@/components/forms/PublicEvidenceUpload";
import { PublicTurnstileField } from "@/components/forms/PublicTurnstileField";
import { hasTurnstileSiteKey } from "@/components/admin/TurnstileWidget";

const turnstileEnabled = hasTurnstileSiteKey();

/** Vercel serverless request body limit — larger uploads go direct to Railway. */
const VERCEL_PROXY_MAX_BYTES = 4 * 1024 * 1024;

type CaseSubmissionFormProps = {
  /** Runtime API base from server env (avoids stale NEXT_PUBLIC_* in client bundle). */
  directApiBaseUrl: string;
};

export function CaseSubmissionForm({ directApiBaseUrl }: CaseSubmissionFormProps) {
  const t = useTranslations("caseSubmission");
  const locale = useLocale() as "en" | "so";
  const lang = locale === "so" ? "so" : "en";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [startedAt] = useState(() => readContactFormStartedAt("caseSubmission"));
  const [canSubmit, setCanSubmit] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<SelectedEvidenceFile[]>([]);
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

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

    const submitterName = String(raw.submitterName ?? "").trim();
    const submitterEmail = String(raw.submitterEmail ?? "").trim();
    const title = String(raw.title ?? "").trim();
    const reasonForVisit = String(raw.reasonForVisit ?? "").trim();
    const incidentDescription = String(raw.incidentDescription ?? "").trim();
    const hospitalName = String(raw.hospitalName ?? "").trim();
    const patientName = String(raw.patientName ?? "").trim();
    const evidenceNotes = String(raw.evidenceNotes ?? "").trim();

    if (submitterName.length < 2) {
      setStatus("error");
      setErrorText(t("nameTooShort"));
      return;
    }
    if (!submitterEmail.includes("@")) {
      setStatus("error");
      setErrorText(t("emailInvalid"));
      return;
    }
    if (title.length < 3) {
      setStatus("error");
      setErrorText(t("titleTooShort"));
      return;
    }
    if (reasonForVisit.length < 3) {
      setStatus("error");
      setErrorText(t("reasonTooShort"));
      return;
    }
    if (incidentDescription.length < 10) {
      setStatus("error");
      setErrorText(t("incidentTooShort"));
      return;
    }
    if (hospitalName.length < 2) {
      setStatus("error");
      setErrorText(t("hospitalTooShort"));
      return;
    }
    if (patientName.length < 2) {
      setStatus("error");
      setErrorText(t("patientTooShort"));
      return;
    }
    if (evidenceFiles.length === 0 && evidenceNotes.length < 10) {
      setStatus("error");
      setErrorText(t("evidenceRequired"));
      return;
    }
    if (evidenceNotes.length > 0 && evidenceNotes.length < 10) {
      setStatus("error");
      setErrorText(t("evidenceTooShort"));
      return;
    }
    if (turnstileEnabled && !captchaToken) {
      setStatus("error");
      setErrorText(t("captchaRequired"));
      return;
    }

    const formData = new FormData(form);
    formData.set("startedAt", String(raw.startedAt ?? startedAt));
    if (captchaToken) formData.set("captchaToken", captchaToken);
    formData.delete("evidence");
    const patientAge = String(raw.patientAge ?? "").trim();
    if (!patientAge) formData.delete("patientAge");
    for (const item of evidenceFiles) {
      formData.append("evidence", item.file);
    }

    const totalEvidenceBytes = evidenceFiles.reduce((sum, item) => sum + item.file.size, 0);
    const useSameOriginProxy =
      evidenceFiles.length === 0 || totalEvidenceBytes <= VERCEL_PROXY_MAX_BYTES;
    const submitUrl = useSameOriginProxy
      ? "/api/public/case-submissions"
      : `${directApiBaseUrl.replace(/\/$/, "")}/api/case-submissions`;

    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        clearContactFormStartedAt("caseSubmission");
        setEvidenceFiles([]);
        setCaptchaToken("");
        setTurnstileResetKey((key) => key + 1);
        setStatus("success");
        form.reset();
        return;
      }

      setCaptchaToken("");
      setTurnstileResetKey((key) => key + 1);

      let apiError = "";
      try {
        const body = (await res.json()) as { error?: string };
        apiError = body.error ?? "";
      } catch {
        apiError = "";
      }
      setStatus("error");
      setErrorText(translatePublicFormError(apiError, t));
    } catch {
      setCaptchaToken("");
      setTurnstileResetKey((key) => key + 1);
      setStatus("error");
      setErrorText(t("networkError"));
    }
  }

  const submitDisabled =
    status === "loading" || !canSubmit || (turnstileEnabled && !captchaToken);

  if (status === "success") {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-6 font-medium text-white/90">
        {t("success")}
      </div>
    );
  }

  const labelClass = "mb-1.5 block text-sm font-semibold text-white/85";
  const fieldClass = "input-base";
  const sectionClass = "space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm font-medium leading-relaxed text-white/70">{t("weeklyLimitNote")}</p>

      <fieldset className={sectionClass}>
        <legend className="mb-4 font-serif text-lg font-bold text-white">{t("sectionContact")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("submitterName")}</label>
            <input name="submitterName" required autoComplete="name" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>{t("submitterEmail")}</label>
            <input name="submitterEmail" type="email" required autoComplete="email" className={fieldClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t("submitterPhone")}</label>
          <input name="submitterPhone" type="tel" autoComplete="tel" className={fieldClass} />
        </div>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="mb-4 font-serif text-lg font-bold text-white">{t("sectionIncident")}</legend>
        <div>
          <label className={labelClass}>{t("title")}</label>
          <input name="title" required className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>{t("reasonForVisit")}</label>
          <textarea name="reasonForVisit" required rows={3} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>{t("incidentDescription")}</label>
          <textarea name="incidentDescription" required rows={6} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>{t("currentCondition")}</label>
          <textarea name="currentCondition" rows={3} className={fieldClass} />
        </div>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="mb-4 font-serif text-lg font-bold text-white">{t("sectionClassification")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("whatWentWrong")}</label>
            <select name="whatWentWrong" required defaultValue="OTHER" className={fieldClass}>
              {WHAT_WENT_WRONG.map((value) => (
                <option key={value} value={value}>
                  {WHAT_WENT_WRONG_LABELS[value][lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("category")}</label>
            <select name="category" required defaultValue="OTHER" className={fieldClass}>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value][lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>{t("incidentDate")}</label>
          <input name="incidentDate" type="date" required className={fieldClass} />
        </div>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="mb-4 font-serif text-lg font-bold text-white">{t("sectionPeople")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("hospitalName")}</label>
            <input name="hospitalName" required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>{t("hospitalLocation")}</label>
            <input name="hospitalLocation" className={fieldClass} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>{t("patientName")}</label>
            <input name="patientName" required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>{t("patientAge")}</label>
            <input name="patientAge" type="number" min={0} max={130} className={fieldClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t("patientGender")}</label>
          <select name="patientGender" defaultValue="" className={fieldClass}>
            <option value="">{t("genderUnknown")}</option>
            <option value="male">{t("genderMale")}</option>
            <option value="female">{t("genderFemale")}</option>
            <option value="other">{t("genderOther")}</option>
            <option value="unknown">{t("genderPreferNot")}</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t("doctorName")}</label>
            <input name="doctorName" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>{t("medicationName")}</label>
            <input name="medicationName" className={fieldClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="mb-4 font-serif text-lg font-bold text-white">{t("sectionEvidence")}</legend>
        <PublicEvidenceUpload
          files={evidenceFiles}
          onChange={setEvidenceFiles}
          disabled={status === "loading"}
        />
        <div className="mt-4">
          <label className={labelClass}>{t("evidenceNotes")}</label>
          <textarea name="evidenceNotes" rows={5} className={fieldClass} />
        </div>
      </fieldset>

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

      {turnstileEnabled && (
        <PublicTurnstileField
          title={t("securityCheckTitle")}
          help={t("securityCheckHelp")}
          loadErrorText={t("turnstileLoadError")}
          onToken={setCaptchaToken}
          resetKey={turnstileResetKey}
        />
      )}

      <Button type="submit" disabled={submitDisabled}>
        {status === "loading"
          ? t("sending")
          : !canSubmit
            ? t("preparing")
            : turnstileEnabled && !captchaToken
              ? t("completeSecurityCheck")
              : t("submit")}
      </Button>
    </form>
  );
}
