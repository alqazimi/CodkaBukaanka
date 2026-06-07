import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCachedPublicCase } from "@/lib/cached-public-api";
import { slugToTitle } from "@/lib/utils";
import { CasePublicReport, type CaseReportLabels } from "@/components/cases/CasePublicReport";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseRecord = await getCachedPublicCase(slug);
  const title = caseRecord?.title ?? slugToTitle(slug) ?? "Case";
  const description =
    caseRecord?.reasonForVisit?.slice(0, 160) ??
    "Verified medical incident record from the CodkaBukaanka archive.";
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    alternates: {
      languages: {
        so: `/so/cases/${slug}`,
        en: `/en/cases/${slug}`,
      },
    },
  };
}

export default async function CasePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const labels: CaseReportLabels =
    locale === "so"
      ? {
          hospital: "Isbitaal",
          patient: "Bukaan",
          doctor: "Dhakhtar",
          medication: "Daawo",
          incidentDate: "Taariikhda dhacdada",
          published: "La daabacay",
          reasonForVisit: "Sababta booqashada",
          incidentDescription: "Faahfaahinta dhacdada",
          currentCondition: "Xaaladda hadda",
          mediaEvidence: "Caddeyn — Warbaahin",
          docsEvidence: "Caddeyn — Dukumiinti",
          disclaimer:
            "Warbixintan waa qayb ka mid ah kayd baaritaan oo la xaqiijiyay. Macluumaadka waxaa laga soo ururiyay caddeymo ay maamulayaashu hubiyeen. Daabacaaddu ma aha go'aan sharci oo kama dambeys ah.",
          verifiedReport: "Warbixin la xaqiijiyay",
          entities: "Xiriirka kiiska",
          narrative: "Warbixinta",
          evidenceSubtitle: "Sawirada iyo qoraallada caddeynta. Muuqaal kooban oo keliya — ma la daabaco faylka asalka ah si loo ilaaliyo asturnaanta.",
          docsSubtitle: "Dukumiintiyada la soo geliyay ee la hubiyay.",
        }
      : {
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
            "This report is part of a verified investigative archive. Information is compiled from evidence reviewed by administrators. Publication does not constitute a legal determination of liability or wrongdoing.",
          verifiedReport: "Verified case report",
          entities: "Case entities",
          narrative: "Report",
          evidenceSubtitle: "Photos with captions. Preview only on the public site — original files are not published for privacy.",
          docsSubtitle: "Supporting documents attached to this case.",
        };

  const caseRecord = await getCachedPublicCase(slug);
  if (!caseRecord) notFound();

  return (
    <div className="page-container max-w-6xl">
      <CasePublicReport caseRecord={caseRecord} locale={locale} labels={labels} />
    </div>
  );
}
