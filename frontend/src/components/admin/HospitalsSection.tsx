"use client";

import { HospitalForm } from "@/components/admin/HospitalForm";
import { HospitalsManager } from "@/components/admin/HospitalsManager";
import { AdminCard } from "@/components/admin/admin-ui";
import { sortByName, useAdminListState } from "@/hooks/use-admin-list-state";

export type HospitalRow = {
  id: string;
  name: string;
  location: string;
  slug: string;
  description?: string | null;
};

export function HospitalsSection({ initialHospitals }: { initialHospitals: HospitalRow[] }) {
  const { items, add, update, remove } = useAdminListState(initialHospitals, sortByName);

  return (
    <>
      <AdminCard className="mt-6">
        <HospitalForm onCreated={add} />
      </AdminCard>
      <HospitalsManager hospitals={items} onUpdated={update} onRemoved={remove} />
    </>
  );
}
