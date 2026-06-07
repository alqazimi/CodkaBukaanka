import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityCard } from "@/components/ui/EntityCard";
import { serverApi } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { CaseCategory, CaseItem, HospitalItem, PatientItem, DoctorItem, MedicationItem } from "@/types/entities";

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function hasCaseFilters(searchParams: Record<string, string | undefined>) {
  return !!(
    searchParams.hospital ||
    searchParams.patient ||
    searchParams.victim ||
    searchParams.category ||
    searchParams.status ||
    searchParams.dateFrom ||
    searchParams.dateTo
  );
}

function buildSearchQuery(searchParams: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) qs.set(key, value);
  });
  return qs.toString();
}

export async function SearchResults({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Record<string, string | undefined>;
}) {
  const t = await getTranslations("search");
  const q = searchParams.q?.trim();
  const lang = locale === "so" ? "so" : "en";
  const filtersActive = hasCaseFilters(searchParams);

  if (q && !filtersActive) {
    const grouped = await serverApi.get<{
      hospitals: HospitalItem[];
      patients: PatientItem[];
      doctors: DoctorItem[];
      medications: MedicationItem[];
      cases: CaseItem[];
    }>(`/api/search?q=${encodeURIComponent(q)}`, { next: { revalidate: 60 } });

    if (!grouped) {
      return <p className="text-muted">{t("noResultsQuery", { query: q })}</p>;
    }

    const hospitals = grouped.hospitals ?? [];
    const patients = grouped.patients ?? [];
    const doctors = grouped.doctors ?? [];
    const medications = grouped.medications ?? [];
    const cases = grouped.cases ?? [];

    const hasResults =
      hospitals.length ||
      patients.length ||
      doctors.length ||
      medications.length ||
      cases.length;

    return (
      <div className="space-y-10">
        {hospitals.length > 0 && (
          <ResultSection title={`${t("sectionHospitals")} (${hospitals.length})`}>
            {hospitals.map((h) => (
              <EntityCard
                key={h.id}
                href={`/hospitals/${h.slug}`}
                title={h.name}
                subtitle={h.location}
                meta={`${h._count?.cases ?? 0} cases`}
              />
            ))}
          </ResultSection>
        )}
        {patients.length > 0 && (
          <ResultSection title={`${t("sectionPatients")} (${patients.length})`}>
            {patients.map((p) => (
              <EntityCard key={p.id} href={`/patients/${p.slug}`} title={p.fullName} meta={`${p._count?.cases ?? 0} cases`} />
            ))}
          </ResultSection>
        )}
        {doctors.length > 0 && (
          <ResultSection title={`${t("sectionDoctors")} (${doctors.length})`}>
            {doctors.map((d) => (
              <EntityCard
                key={d.id}
                href={`/doctors/${d.slug}`}
                title={d.fullName}
                subtitle={d.specialty ?? d.hospital?.name}
                meta={`${d._count?.cases ?? 0} cases`}
              />
            ))}
          </ResultSection>
        )}
        {medications.length > 0 && (
          <ResultSection title={`${t("sectionMedications")} (${medications.length})`}>
            {medications.map((m) => (
              <EntityCard
                key={m.id}
                href={`/medications/${m.slug}`}
                title={m.name}
                subtitle={m.type}
                meta={`${m._count?.cases ?? 0} cases`}
              />
            ))}
          </ResultSection>
        )}
        {cases.length > 0 && (
          <ResultSection title={`${t("sectionCases")} (${cases.length})`}>
            <div className="grid gap-5 md:grid-cols-2">
              {cases.map((c) => (
                <CaseCard key={c.slug} caseItem={c} locale={locale} />
              ))}
            </div>
          </ResultSection>
        )}
        {!hasResults && (
          <p className="card-surface p-8 text-center text-muted">{t("noResultsQuery", { query: q })}</p>
        )}
      </div>
    );
  }

  const query = buildSearchQuery(searchParams);
  const result = await serverApi.get<{ cases: CaseItem[]; total: number }>(
    `/api/search?${query}`,
    { next: { revalidate: 60 } }
  );

  const category = searchParams.category as CaseCategory | undefined;
  const categoryLabel = category && category in CATEGORY_LABELS ? CATEGORY_LABELS[category][lang] : null;

  return (
    <>
      {(q || filtersActive) && (
        <p className="mb-6 text-base text-muted">
          {q && categoryLabel
            ? t("casesFoundInCategory", { count: result?.total ?? 0, category: categoryLabel })
            : q
              ? t("casesFoundFor", { count: result?.total ?? 0, query: q })
              : categoryLabel
                ? t("casesFoundInCategory", { count: result?.total ?? 0, category: categoryLabel })
                : t("casesFound", { count: result?.total ?? 0 })}
        </p>
      )}
      {(result?.cases ?? []).length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {(result?.cases ?? []).map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      ) : (
        (q || filtersActive) && (
          <p className="card-surface p-8 text-center text-base text-muted">
            {q ? t("noResultsQuery", { query: q }) : t("noMatchingCases")}
          </p>
        )
      )}
    </>
  );
}
