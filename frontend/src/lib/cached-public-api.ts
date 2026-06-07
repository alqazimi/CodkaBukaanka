import { cache } from "react";
import { serverApi } from "./api";
import type { CaseItem } from "@/types/entities";

/** One fetch per slug per request (metadata + page share the same result). */
export const getCachedPublicCase = cache(async (slug: string) =>
  serverApi.get<CaseItem>(`/api/cases/slug/${slug}`, { next: { revalidate: 120 } })
);
