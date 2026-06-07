import { getCachedHospitals } from "@/lib/cached-public-api";
import { EntityCard } from "@/components/ui/EntityCard";

export async function HospitalGrid({ locale }: { locale: string }) {
  const hospitals = await getCachedHospitals();
  const isSo = locale === "so";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {hospitals.map((h) => (
        <EntityCard
          key={h.id}
          href={`/hospitals/${h.slug}`}
          title={h.name}
          subtitle={h.location}
          meta={`${h._count?.cases ?? 0} ${isSo ? "kiis" : "cases"}`}
        />
      ))}
    </div>
  );
}
