import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientGrid } from "@/components/list/PatientGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-container">
      <PageHeader
        title="Patients"
        description="Individuals documented in verified medical incident records."
      />
      <Suspense fallback={<EntityListSkeleton layout="list" count={8} />}>
        <PatientGrid />
      </Suspense>
    </div>
  );
}
