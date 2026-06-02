"use client";

import { DoctorForm } from "@/components/admin/DoctorForm";
import { DoctorsManager } from "@/components/admin/DoctorsManager";
import { AdminCard } from "@/components/admin/admin-ui";
import { sortByName, useAdminListState } from "@/hooks/use-admin-list-state";
import type { DoctorRow } from "@/components/admin/DoctorsManager";

export function DoctorsSection({
  initialDoctors,
  hospitals,
}: {
  initialDoctors: DoctorRow[];
  hospitals: { id: string; name: string }[];
}) {
  const { items, add, update, remove } = useAdminListState(initialDoctors, sortByName);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
      <AdminCard className="lg:col-span-1">
        <DoctorForm hospitals={hospitals} onCreated={add} />
      </AdminCard>
      <div className="lg:col-span-2">
        <DoctorsManager doctors={items} hospitals={hospitals} onUpdated={update} onRemoved={remove} />
      </div>
    </div>
  );
}
