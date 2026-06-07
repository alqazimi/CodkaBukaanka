import { cache } from "react";
import { auth, getAccessToken } from "@/auth";

/** Dedupe session/token reads within a single server render (layout + page). */
export const getCachedAdminSession = cache(async () => auth());

export const getCachedAccessToken = cache(async () => getAccessToken());
