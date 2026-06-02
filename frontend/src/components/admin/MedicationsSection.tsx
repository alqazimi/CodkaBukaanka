"use client";

import { MedicationForm } from "@/components/admin/MedicationForm";
import { MedicationsManager } from "@/components/admin/MedicationsManager";
import { AdminCard } from "@/components/admin/admin-ui";
import { sortByName, useAdminListState } from "@/hooks/use-admin-list-state";
import type { MedicationRow } from "@/components/admin/MedicationsManager";

export function MedicationsSection({ initialMedications }: { initialMedications: MedicationRow[] }) {
  const { items, add, update, remove } = useAdminListState(initialMedications, sortByName);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
      <AdminCard className="lg:col-span-1">
        <MedicationForm onCreated={add} />
      </AdminCard>
      <div className="lg:col-span-2">
        <MedicationsManager medications={items} onUpdated={update} onRemoved={remove} />
      </div>
    </div>
  );
}
