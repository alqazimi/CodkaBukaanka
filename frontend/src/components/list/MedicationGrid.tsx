import { getCachedMedications } from "@/lib/cached-public-api";
import { EntityCard } from "@/components/ui/EntityCard";

export async function MedicationGrid() {
  const medications = await getCachedMedications();

  return (
    <div className="grid gap-3">
      {medications.map((m) => (
        <EntityCard
          key={m.id}
          href={`/medications/${m.slug}`}
          title={m.name}
          subtitle={m.type}
          meta={`${m._count?.cases ?? 0} cases`}
        />
      ))}
    </div>
  );
}
