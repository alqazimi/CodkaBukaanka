"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/45 bg-gradient-to-r from-red-600 to-red-700 font-semibold text-white shadow-[0_0_20px_rgb(220_38_38/0.3)] transition hover:border-red-400 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-0";

export function SearchNavButton({
  className,
  showLabel = true,
  onNavigate,
}: {
  className?: string;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");

  return (
    <Link
      href="/search"
      prefetch
      onClick={onNavigate}
      className={cn(baseClass, showLabel ? "min-h-[44px] px-4 py-2 text-sm" : "h-11 w-11", className)}
      aria-label={t("search")}
    >
      <Search className="h-5 w-5 shrink-0" aria-hidden />
      {showLabel && <span>{t("searchShort")}</span>}
    </Link>
  );
}

export function StickySearchFab() {
  const t = useTranslations("nav");

  return (
    <Link
      href="/search"
      prefetch
      className={cn(
        baseClass,
        "fixed bottom-5 right-4 z-40 h-14 min-w-[3.5rem] px-4 shadow-lg sm:right-6",
        "pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      )}
      aria-label={t("search")}
    >
      <Search className="h-6 w-6 shrink-0" aria-hidden />
      <span className="text-sm">{t("searchShort")}</span>
    </Link>
  );
}
