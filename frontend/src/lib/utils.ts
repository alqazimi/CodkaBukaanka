import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(date: Date | string, locale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "so" ? "so-SO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string
): string {
  const soKey = `${field}So`;
  if (locale === "so" && soKey in item && item[soKey]) {
    return String(item[soKey]);
  }
  return String(item[field] ?? "");
}

export const DISCLAIMER_EN =
  "This report is part of a public documentation archive. Information is compiled from evidence reviewed by administrators. Publication does not constitute a legal determination of liability or wrongdoing.";

export const DISCLAIMER_SO =
  "Warbixintan waa qayb ka mid ah diiwaanka dukumiintiga dadweynaha. Macluumaadka waxaa soo ururiyay maamulayaasha kadib markii la hubiyay caddaymaha. Daabacaaddu ma aha go'aan sharci oo ku saabsan mas'uuliyad ama khalad.";
