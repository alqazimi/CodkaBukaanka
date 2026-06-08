"use client";

import { useTranslations } from "next-intl";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

/** Inline search in the header row — desktop only (lg+). Phones/tablets use MobileHeaderSearch. */
export function DesktopHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="hidden min-w-0 flex-1 lg:block lg:max-w-sm xl:max-w-md">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}

/** Phones and tablets — full-width search row below the main header toolbar. */
export function MobileHeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="border-t border-white/10 bg-transparent px-4 py-3 backdrop-blur-xl lg:hidden">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}
