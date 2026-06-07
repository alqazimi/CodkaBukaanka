"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { readUserLocaleChoice, setUserLocaleChoice } from "@/lib/locale-preference";
import { DEFAULT_PUBLIC_LOCALE } from "@/lib/public-locale";

type AdminLocaleToggleProps = {
  className?: string;
  showLabel?: boolean;
  variant?: "bar" | "login";
  onToggle?: () => void;
};

export function AdminLocaleToggle({
  className,
  showLabel = true,
  variant = "bar",
  onToggle,
}: AdminLocaleToggleProps) {
  const [locale, setLocale] = useState<"en" | "so">("so");

  useEffect(() => {
    setLocale(readUserLocaleChoice());
  }, []);

  const switchLocale = locale === "en" ? "so" : "en";
  const switchLabel = switchLocale === "en" ? "English" : "Somali";

  const toggle = useCallback(() => {
    setUserLocaleChoice(switchLocale);
    setLocale(switchLocale);
    onToggle?.();
  }, [switchLocale, onToggle]);

  const variantClass =
    variant === "login"
      ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
      : "border-white/10 bg-white/5 text-white/90 hover:border-red-400/45 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40",
        showLabel ? "min-w-[4.25rem]" : "w-10 px-0",
        variantClass,
        className
      )}
      aria-label={`Switch to ${switchLabel}`}
      title={`Language: ${locale === "en" ? "English" : "Somali"} — tap to switch to ${switchLabel}`}
    >
      <Globe className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
      {showLabel && <span className="uppercase tracking-wide">{switchLocale}</span>}
    </button>
  );
}

export function AdminPublicSiteLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [locale, setLocale] = useState<"en" | "so">(DEFAULT_PUBLIC_LOCALE);

  useEffect(() => {
    setLocale(readUserLocaleChoice());
  }, []);

  return (
    <Link
      href={`/${locale}`}
      className={cn(
        "flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
      onClick={onNavigate}
    >
      <ExternalLink className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
      <span>View public site ({locale === "en" ? "English" : "Somali"})</span>
    </Link>
  );
}
