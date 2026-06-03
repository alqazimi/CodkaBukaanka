"use client";

import { useTranslations } from "next-intl";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

/** Inline search for pages without their own search UI (hidden on home and /search). */
export function DesktopHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="hidden min-w-0 flex-1 md:block lg:max-w-sm xl:max-w-md">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}

/** Phones only — tablets+ use the inline bar in the main header row. */
export function MobileHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="border-t border-navy-100/80 bg-white/90 px-4 py-3 dark:border-navy-800/80 dark:bg-navy-950/90 md:hidden">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}
