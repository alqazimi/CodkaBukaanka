"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { setUserLocaleChoice } from "@/lib/locale-preference";

const buttonClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-navy-200/90 bg-white px-2.5 text-xs font-semibold text-navy-800 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-100 dark:hover:border-teal-600 dark:hover:bg-navy-700";

export function LocaleToggle({
  className,
  showLabel = true,
  compactLabel = false,
  onNavigate,
}: {
  className?: string;
  showLabel?: boolean;
  compactLabel?: boolean;
  onNavigate?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const switchLocale = locale === "en" ? "so" : "en";
  const nextLanguage = switchLocale === "en" ? t("languageEnglish") : t("languageSomali");

  const labelText =
    locale === "so"
      ? compactLabel
        ? "EN"
        : t("translateToEnglish")
      : compactLabel
        ? "SO"
        : t("translateToSomali");

  function handleClick() {
    setUserLocaleChoice(switchLocale);
    onNavigate?.();
  }

  return (
    <Link
      href={pathname}
      locale={switchLocale}
      prefetch
      onClick={handleClick}
      className={cn(buttonClass, !showLabel && "w-10 px-0", className)}
      aria-label={t("switchLanguage", { language: nextLanguage })}
      title={t("switchLanguage", { language: nextLanguage })}
    >
      <Globe className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
      {showLabel && <span className={compactLabel ? "uppercase tracking-wide" : ""}>{labelText}</span>}
    </Link>
  );
}
