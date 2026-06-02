import { setRequestLocale } from "next-intl/server";
import { serverApi, unwrapList } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import type { DoctorItem } from "@/types/entities";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Doctors" };

export default async function DoctorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const doctors = unwrapList(
    await serverApi.get<DoctorItem[] | { items: DoctorItem[] }>("/api/doctors?limit=24", { next: { revalidate: 300 } })
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Doctors"
        description="Medical professionals referenced in documented incident records."
      />
      <div className="grid gap-3">
        {(doctors ?? []).map((d) => (
          <EntityCard
            key={d.id}
            href={`/doctors/${d.slug}`}
            title={d.fullName}
            subtitle={d.specialty}
            meta={`${d._count?.cases ?? 0} cases`}
          />
        ))}
      </div>
    </div>
  );
}
