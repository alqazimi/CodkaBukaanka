"use client";

import { useTranslations } from "next-intl";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

export function HeaderSearch() {
  const t = useTranslations("search");

  return (
    <div className="hidden min-w-0 flex-1 md:block lg:max-w-md xl:max-w-lg">
      <GlobalSearchBar
        placeholder={t("placeholder")}
        submitLabel={t("submit")}
        hint={t("hint")}
        size="compact"
        className="w-full"
      />
    </div>
  );
}
