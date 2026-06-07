import { getCachedDoctors } from "@/lib/cached-public-api";
import { EntityCard } from "@/components/ui/EntityCard";

export async function DoctorGrid({ locale = "en" }: { locale?: string }) {
  const doctors = await getCachedDoctors();
  const isSo = locale === "so";

  return (
    <div className="grid gap-3">
      {doctors.map((d) => (
        <EntityCard
          key={d.id}
          href={`/doctors/${d.slug}`}
          title={d.fullName}
          subtitle={d.specialty}
          meta={`${d._count?.cases ?? 0} ${isSo ? "kiis" : "cases"}`}
        />
      ))}
    </div>
  );
}
