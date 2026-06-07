import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AdminPage, AdminHero, adminBtnSecondary } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { CasePublicReport, type CaseReportLabels } from "@/components/cases/CasePublicReport";
import Link from "next/link";
import type { CaseItem, CaseStatus } from "@/types/entities";
import { STATUS_LABELS } from "@/lib/constants";

const previewLabels: CaseReportLabels = {
  hospital: "Hospital",
  patient: "Patient",
  doctor: "Doctor",
  medication: "Medication",
  incidentDate: "Incident date",
  published: "Published",
  reasonForVisit: "Reason for visit",
  incidentDescription: "Incident description",
  currentCondition: "Current condition",
  mediaEvidence: "Evidence — Media",
  docsEvidence: "Evidence — Documents",
  disclaimer:
    "Admin preview — this is how the published case will appear on the public site (public evidence only).",
  verifiedReport: "Preview — verified case report",
  entities: "Case entities",
  narrative: "Report",
  evidenceSubtitle: "Public site shows preview only. Admins can open originals below when testing.",
  docsSubtitle: "Public documents only.",
};

export default async function CasePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const { data: caseRecord, error } = await adminServerGet<CaseItem>(`/api/admin/cases/${id}`);

  if (!caseRecord && !error) notFound();
  if (!caseRecord) {
    return (
      <AdminPage>
        <AdminApiErrorBanner message={error ?? "Could not load case preview."} />
      </AdminPage>
    );
  }

  const publicEvidence = (caseRecord.evidence ?? []).filter((e) => e.visibility === "PUBLIC");
  const previewCase: CaseItem = {
    ...caseRecord,
    evidence: publicEvidence,
  };

  return (
    <AdminPage>
      <AdminHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Admin preview</p>
            <p className="mt-1 text-sm text-muted">
              Matches the public published case layout.
            </p>
          </div>
          <Link href={`/admin/cases/${id}`} className={`${adminBtnSecondary} text-center`}>
            Back to edit
          </Link>
        </div>
      </AdminHero>

      {caseRecord.status !== "PUBLISHED" && (
        <p className="mb-6 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-white/90">
          This case is <strong>{STATUS_LABELS[caseRecord.status as CaseStatus]?.en ?? caseRecord.status}</strong> — not
          visible on the public site until published.
        </p>
      )}

      <div className="max-w-6xl">
        <CasePublicReport
          caseRecord={previewCase}
          locale="en"
          labels={previewLabels}
          allowOpenOriginal
        />
      </div>
    </AdminPage>
  );
}
