import { getCachedPatients } from "@/lib/cached-public-api";
import { EntityCard } from "@/components/ui/EntityCard";

export async function PatientGrid() {
  const patients = await getCachedPatients();

  return (
    <div className="grid gap-3">
      {patients.map((p) => (
        <EntityCard
          key={p.id}
          href={`/patients/${p.slug}`}
          title={p.fullName}
          meta={`${p._count?.cases ?? 0} cases`}
        />
      ))}
    </div>
  );
}
