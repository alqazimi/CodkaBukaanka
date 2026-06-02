"use client";

import { useTranslations } from "next-intl";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

/** Search in the top bar (tablet + laptop + desktop). Hidden on homepage (hero has search). */
export function DesktopHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="hidden min-w-0 flex-1 md:block lg:max-w-xs xl:max-w-md 2xl:max-w-lg">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}

/** Second search row — phones only (md+ uses bar above). */
export function MobileHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="border-t border-navy-100/80 bg-white/90 px-4 py-2.5 dark:border-navy-800/80 dark:bg-navy-950/90 md:hidden">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="mobile"
        className="w-full"
      />
    </div>
  );
}
