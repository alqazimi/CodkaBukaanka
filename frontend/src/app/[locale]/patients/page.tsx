import { setRequestLocale } from "next-intl/server";
import { serverApi, unwrapList } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import type { PatientItem } from "@/types/entities";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const patients = unwrapList(
    await serverApi.get<PatientItem[] | { items: PatientItem[] }>("/api/patients?limit=24", { next: { revalidate: 300 } })
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Patients"
        description="Individuals documented in verified medical incident records."
      />
      <div className="grid gap-3">
        {(patients ?? []).map((p) => (
          <EntityCard
            key={p.id}
            href={`/patients/${p.slug}`}
            title={p.fullName}
            meta={`${p._count?.cases ?? 0} cases`}
          />
        ))}
      </div>
    </div>
  );
}
