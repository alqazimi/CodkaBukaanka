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

export function CaseSubmissionForm() {
  const t = useTranslations("caseSubmission");
  const locale = useLocale() as "en" | "so";
  const lang = locale === "so" ? "so" : "en";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [startedAt] = useState(() => readContactFormStartedAt("caseSubmission"));
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

    const payload: Record<string, string | number> = {
      submitterName: String(raw.submitterName ?? "").trim(),
      submitterEmail: String(raw.submitterEmail ?? "").trim(),
      submitterPhone: String(raw.submitterPhone ?? "").trim(),
      title: String(raw.title ?? "").trim(),
      reasonForVisit: String(raw.reasonForVisit ?? "").trim(),
      incidentDescription: String(raw.incidentDescription ?? "").trim(),
      currentCondition: String(raw.currentCondition ?? "").trim(),
      whatWentWrong: String(raw.whatWentWrong ?? "").trim(),
      category: String(raw.category ?? "").trim(),
      incidentDate: String(raw.incidentDate ?? "").trim(),
      hospitalName: String(raw.hospitalName ?? "").trim(),
      hospitalLocation: String(raw.hospitalLocation ?? "").trim(),
      patientName: String(raw.patientName ?? "").trim(),
      patientGender: String(raw.patientGender ?? "").trim(),
      doctorName: String(raw.doctorName ?? "").trim(),
      medicationName: String(raw.medicationName ?? "").trim(),
      evidenceNotes: String(raw.evidenceNotes ?? "").trim(),
      website: String(raw.website ?? "").trim(),
      startedAt: String(raw.startedAt ?? startedAt).trim(),
    };

    const patientAgeRaw = String(raw.patientAge ?? "").trim();
    if (patientAgeRaw) payload.patientAge = Number(patientAgeRaw);

    for (const key of [
      "submitterPhone",
      "currentCondition",
      "hospitalLocation",
      "patientGender",
      "doctorName",
      "medicationName",
    ] as const) {
      if (!String(payload[key] ?? "").trim()) delete payload[key];
    }

    if (String(payload.submitterName).length < 2) {
      setStatus("error");
      setErrorText(t("nameTooShort"));
      return;
    }
    if (!String(payload.submitterEmail).includes("@")) {
      setStatus("error");
      setErrorText(t("emailInvalid"));
      return;
    }
    if (String(payload.title).length < 3) {
      setStatus("error");
      setErrorText(t("titleTooShort"));
      return;
    }
    if (String(payload.reasonForVisit).length < 3) {
      setStatus("error");
      setErrorText(t("reasonTooShort"));
      return;
    }
    if (String(payload.incidentDescription).length < 10) {
      setStatus("error");
      setErrorText(t("incidentTooShort"));
      return;
    }
    if (String(payload.hospitalName).length < 2) {
      setStatus("error");
      setErrorText(t("hospitalTooShort"));
      return;
    }
    if (String(payload.patientName).length < 2) {
      setStatus("error");
      setErrorText(t("patientTooShort"));
      return;
    }
    if (String(payload.evidenceNotes).length < 10) {
      setStatus("error");
      setErrorText(t("evidenceTooShort"));
      return;
    }

    const res = await fetch("/api/public/case-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });

    if (res.ok) {
      clearContactFormStartedAt("caseSubmission");
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
        <p className="mb-3 text-sm font-medium text-white/65">{t("evidenceHelp")}</p>
        <div>
          <label className={labelClass}>{t("evidenceNotes")}</label>
          <textarea name="evidenceNotes" required rows={5} className={fieldClass} />
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

      <Button type="submit" disabled={status === "loading" || !canSubmit}>
        {status === "loading" ? t("sending") : !canSubmit ? t("preparing") : t("submit")}
      </Button>
    </form>
  );
}
