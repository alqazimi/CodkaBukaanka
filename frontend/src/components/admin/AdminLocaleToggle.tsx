"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE = "NEXT_LOCALE";

function readLocale(): "en" | "so" {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(en|so)`));
  return match?.[1] === "so" ? "so" : "en";
}

function writeLocale(locale: "en" | "so") {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

type AdminLocaleToggleProps = {
  className?: string;
  showLabel?: boolean;
  variant?: "sidebar" | "bar" | "login";
  onToggle?: () => void;
};

export function AdminLocaleToggle({
  className,
  showLabel = true,
  variant = "sidebar",
  onToggle,
}: AdminLocaleToggleProps) {
  const [locale, setLocale] = useState<"en" | "so">("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocale(readLocale());
    setMounted(true);
  }, []);

  const switchLocale = locale === "en" ? "so" : "en";
  const switchLabel = switchLocale === "en" ? "English" : "Somali";

  const toggle = useCallback(() => {
    const next = readLocale() === "en" ? "so" : "en";
    writeLocale(next);
    setLocale(next);
    onToggle?.();
  }, [onToggle]);

  const variantClass =
    variant === "bar"
      ? "border-navy-700 bg-navy-900 text-navy-100 hover:border-teal-600 hover:bg-navy-800"
      : variant === "login"
        ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
        : "border-navy-600 bg-navy-800/90 text-navy-100 hover:border-teal-600 hover:bg-navy-700";

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy-700 bg-navy-800/50",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40",
        showLabel ? "min-w-[4.25rem]" : "w-10 px-0",
        variantClass,
        className
      )}
      aria-label={`Switch to ${switchLabel}`}
      title={`Language: ${locale === "en" ? "English" : "Somali"} — tap to switch to ${switchLabel}`}
    >
      <Globe className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
      {showLabel && <span className="uppercase tracking-wide">{switchLocale}</span>}
    </button>
  );
}

/** Link to the public site using the active locale cookie. */
export function AdminPublicSiteLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [locale, setLocale] = useState<"en" | "so">("en");

  useEffect(() => {
    setLocale(readLocale());
  }, []);

  return (
    <Link
      href={`/${locale}`}
      className={cn(
        "flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-navy-300 transition-colors hover:bg-navy-800 hover:text-white",
        className
      )}
      onClick={onNavigate}
    >
      <Globe className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
      <span>
        View public site ({locale === "en" ? "English" : "Somali"})
      </span>
    </Link>
  );
}
