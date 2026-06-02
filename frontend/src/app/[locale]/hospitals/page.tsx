import { setRequestLocale, getTranslations } from "next-intl/server";
import { serverApi, unwrapList } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import type { HospitalItem } from "@/types/entities";

export default async function HospitalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hospital");
  const isSo = locale === "so";

  const hospitals = unwrapList(
    await serverApi.get<HospitalItem[] | { items: HospitalItem[] }>("/api/hospitals?limit=24", { next: { revalidate: 300 } })
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={t("title")}
        description={
          isSo
            ? "Isbitaalada lagu xusay kiisaska caafimaad ee la xaqiijiyay."
            : "Hospitals referenced in verified medical incident records."
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(hospitals ?? []).map((h) => (
          <EntityCard
            key={h.id}
            href={`/hospitals/${h.slug}`}
            title={h.name}
            subtitle={h.location}
            meta={`${h._count?.cases ?? 0} ${isSo ? "kiis" : "cases"}`}
          />
        ))}
      </div>
    </div>
  );
}
