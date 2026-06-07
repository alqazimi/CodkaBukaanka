"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { setUserLocaleChoice } from "@/lib/locale-preference";

const buttonClass = "header-control-btn";

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
      onClick={handleClick}
      className={cn(buttonClass, "px-2.5", !showLabel && "w-10 px-0", className)}
      aria-label={t("switchLanguage", { language: nextLanguage })}
      title={t("switchLanguage", { language: nextLanguage })}
    >
      <Globe className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
      {showLabel && <span className={compactLabel ? "uppercase tracking-wide" : ""}>{labelText}</span>}
    </Link>
  );
}
