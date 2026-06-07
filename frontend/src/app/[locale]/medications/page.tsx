import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { MedicationGrid } from "@/components/list/MedicationGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Medications" };

export default async function MedicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-container">
      <PageHeader
        title="Medications"
        description="Medications involved in documented medical incident cases."
      />
      <Suspense fallback={<EntityListSkeleton layout="list" count={8} />}>
        <MedicationGrid />
      </Suspense>
    </div>
  );
}
