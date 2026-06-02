import type { ReactNode } from "react";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityCard } from "@/components/ui/EntityCard";
import { serverApi } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { CaseCategory, CaseItem, HospitalItem, PatientItem, DoctorItem, MedicationItem } from "@/types/entities";

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-bold text-navy-900">{title}</h2>
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
    }>(`/api/search?q=${encodeURIComponent(q)}`, { next: { revalidate: 30 } });

    if (!grouped) return <p className="text-navy-600">No results found.</p>;

    const hasResults =
      grouped.hospitals.length ||
      grouped.patients.length ||
      grouped.doctors.length ||
      grouped.medications.length ||
      grouped.cases.length;

    return (
      <div className="space-y-10">
        {grouped.hospitals.length > 0 && (
          <ResultSection title={`Hospitals (${grouped.hospitals.length})`}>
            {grouped.hospitals.map((h) => (
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
        {grouped.patients.length > 0 && (
          <ResultSection title={`Patients (${grouped.patients.length})`}>
            {grouped.patients.map((p) => (
              <EntityCard key={p.id} href={`/patients/${p.slug}`} title={p.fullName} meta={`${p._count?.cases ?? 0} cases`} />
            ))}
          </ResultSection>
        )}
        {grouped.doctors.length > 0 && (
          <ResultSection title={`Doctors (${grouped.doctors.length})`}>
            {grouped.doctors.map((d) => (
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
        {grouped.medications.length > 0 && (
          <ResultSection title={`Medications (${grouped.medications.length})`}>
            {grouped.medications.map((m) => (
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
        {grouped.cases.length > 0 && (
          <ResultSection title={`Cases (${grouped.cases.length})`}>
            <div className="grid gap-5 md:grid-cols-2">
              {grouped.cases.map((c) => (
                <CaseCard key={c.slug} caseItem={c} locale={locale} />
              ))}
            </div>
          </ResultSection>
        )}
        {!hasResults && (
          <p className="card-surface p-8 text-center text-navy-600">No results for &quot;{q}&quot;</p>
        )}
      </div>
    );
  }

  const query = buildSearchQuery(searchParams);
  const result = await serverApi.get<{ cases: CaseItem[]; total: number }>(
    `/api/search?${query}`,
    { next: { revalidate: 30 } }
  );

  const category = searchParams.category as CaseCategory | undefined;
  const categoryLabel = category && category in CATEGORY_LABELS ? CATEGORY_LABELS[category][lang] : null;

  return (
    <>
      {(q || filtersActive) && (
        <p className="mb-6 text-sm text-navy-600">
          {result?.total ?? 0} cases found
          {q && <> for &quot;{q}&quot;</>}
          {categoryLabel && <> in {categoryLabel}</>}
        </p>
      )}
      {(result?.cases ?? []).length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {(result?.cases ?? []).map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="card-surface p-8 text-center text-navy-600">
          No matching cases
          {q && <> for &quot;{q}&quot;</>}
          {categoryLabel && <> in {categoryLabel}</>}
          .
        </p>
      )}
    </>
  );
}
