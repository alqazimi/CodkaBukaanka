"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { setUserLocaleChoice } from "@/lib/locale-preference";

const buttonClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 text-xs font-semibold text-white/90 backdrop-blur-xl transition-all duration-200 hover:border-red-400/40 hover:bg-white/10 hover:text-white";

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
      className={cn(buttonClass, !showLabel && "w-10 px-0", className)}
      aria-label={t("switchLanguage", { language: nextLanguage })}
      title={t("switchLanguage", { language: nextLanguage })}
    >
      <Globe className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
      {showLabel && <span className={compactLabel ? "uppercase tracking-wide" : ""}>{labelText}</span>}
    </Link>
  );
}
