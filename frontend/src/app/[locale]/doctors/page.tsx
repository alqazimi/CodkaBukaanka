import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { DoctorGrid } from "@/components/list/DoctorGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Doctors" };

export default async function DoctorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-container">
      <PageHeader
        title="Doctors"
        description="Medical professionals referenced in documented incident records."
      />
      <Suspense fallback={<EntityListSkeleton layout="list" count={8} />}>
        <DoctorGrid />
      </Suspense>
    </div>
  );
}
