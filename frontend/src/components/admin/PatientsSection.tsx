"use client";

import { PatientForm } from "@/components/admin/PatientForm";
import { PatientsManager } from "@/components/admin/PatientsManager";
import { AdminCard } from "@/components/admin/admin-ui";
import { sortByName, useAdminListState } from "@/hooks/use-admin-list-state";

export type PatientRow = {
  id: string;
  fullName: string;
  age?: number | null;
  gender?: string | null;
};

export function PatientsSection({ initialPatients }: { initialPatients: PatientRow[] }) {
  const { items, add, update, remove } = useAdminListState(initialPatients, sortByName);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
      <AdminCard className="lg:col-span-1">
        <PatientForm onCreated={add} />
      </AdminCard>
      <div className="lg:col-span-2">
        <PatientsManager patients={items} onUpdated={update} onRemoved={remove} />
      </div>
    </div>
  );
}
