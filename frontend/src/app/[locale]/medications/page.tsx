import { setRequestLocale } from "next-intl/server";
import { serverApi, unwrapList } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import type { MedicationItem } from "@/types/entities";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Medications" };

export default async function MedicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const medications = unwrapList(
    await serverApi.get<MedicationItem[] | { items: MedicationItem[] }>("/api/medications?limit=24", { next: { revalidate: 300 } })
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Medications"
        description="Medications involved in documented medical incident cases."
      />
      <div className="grid gap-3">
        {(medications ?? []).map((m) => (
          <EntityCard
            key={m.id}
            href={`/medications/${m.slug}`}
            title={m.name}
            subtitle={m.type}
            meta={`${m._count?.cases ?? 0} cases`}
          />
        ))}
      </div>
    </div>
  );
}
