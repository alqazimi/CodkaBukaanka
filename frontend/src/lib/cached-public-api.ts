import { cache } from "react";
import { serverApi, unwrapList } from "./api";
import type { CaseItem, DoctorItem, HospitalItem, MedicationItem, PatientItem } from "@/types/entities";

const listRevalidate = { next: { revalidate: 300 } } as const;

/** One fetch per slug per request (metadata + page share the same result). */
export const getCachedPublicCase = cache(async (slug: string) =>
  serverApi.get<CaseItem>(`/api/cases/slug/${slug}`, { next: { revalidate: 120 } })
);

export const getCachedHospitals = cache(async () =>
  unwrapList(
    await serverApi.get<HospitalItem[] | { items: HospitalItem[] }>("/api/hospitals?limit=24", listRevalidate)
  )
);

export const getCachedPatients = cache(async () =>
  unwrapList(
    await serverApi.get<PatientItem[] | { items: PatientItem[] }>("/api/patients?limit=24", listRevalidate)
  )
);

export const getCachedDoctors = cache(async () =>
  unwrapList(
    await serverApi.get<DoctorItem[] | { items: DoctorItem[] }>("/api/doctors?limit=24", listRevalidate)
  )
);

export const getCachedMedications = cache(async () =>
  unwrapList(
    await serverApi.get<MedicationItem[] | { items: MedicationItem[] }>("/api/medications?limit=24", listRevalidate)
  )
);
