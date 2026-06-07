"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Search, Building2, User, FileText, Stethoscope, Pill, FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  type: "hospital" | "patient" | "doctor" | "medication" | "case" | "victim" | "submit-case";
  label: string;
  slug: string;
  meta?: string;
};

const SUBMIT_CASE_KEYWORDS = [
  "submit",
  "report",
  "gudbi",
  "kiis",
  "warbixin",
  "warbix",
  "soo gudbi",
  "new case",
  "incident",
  "dhacdo",
];

function matchesSubmitCaseIntent(query: string): boolean {
  const lower = query.trim().toLowerCase();
  if (lower.length < 2) return false;
  return SUBMIT_CASE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function GlobalSearchBar({
  placeholder,
  defaultValue = "",
  className = "",
  submitLabel = "Search",
  hint,
  onDark = false,
  size = "default",
}: {
  placeholder: string;
  defaultValue?: string;
  className?: string;
  submitLabel?: string;
  hint?: string;
  onDark?: boolean;
  size?: "default" | "compact" | "large" | "mobile";
}) {
  const router = useRouter();
  const t = useTranslations("search");
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const submitCaseSuggestion = useMemo((): Suggestion | null => {
    if (!matchesSubmitCaseIntent(q)) return null;
    return {
      type: "submit-case",
      label: t("submitCaseSuggest"),
      slug: "submit-case",
      meta: t("submitCaseSuggestMeta"),
    };
  }, [q, t]);

  const visibleSuggestions = useMemo(() => {
    if (!submitCaseSuggestion) return suggestions;
    return [submitCaseSuggestion, ...suggestions];
  }, [submitCaseSuggestion, suggestions]);

  useEffect(() => {
    setQ(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        if (res.ok) setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function goSearch(term?: string) {
    const query = (term ?? q).trim();
    if (!query) return;
    setOpen(false);
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    params.set("q", query);
    router.push(`/search?${params.toString()}`);
  }

  function goSuggestion(s: Suggestion) {
    setOpen(false);
    if (s.type === "submit-case") {
      router.push("/submit-case");
      return;
    }
    const type = s.type === "victim" ? "patient" : s.type;
    const paths: Record<string, string> = {
      hospital: `/hospitals/${s.slug}`,
      patient: `/patients/${s.slug}`,
      doctor: `/doctors/${s.slug}`,
      medication: `/medications/${s.slug}`,
      case: `/cases/${s.slug}`,
    };
    router.push(paths[type] ?? `/search?q=${encodeURIComponent(s.label)}`);
  }

  const icons = {
    hospital: Building2,
    patient: User,
    victim: User,
    doctor: Stethoscope,
    medication: Pill,
    case: FileText,
    "submit-case": FilePlus2,
  };

  const inputSize =
    size === "large"
      ? "min-h-[52px] py-3.5 pl-12 pr-[3.25rem] text-base sm:min-h-[56px] sm:py-4 sm:pr-28 sm:text-lg"
      : size === "mobile"
        ? "min-h-[48px] py-3 pl-11 pr-4 text-base"
        : size === "compact"
          ? "min-h-[44px] py-2.5 pl-10 pr-3 text-sm"
          : "min-h-[52px] py-3.5 pl-12 pr-4 text-base";

  const iconSize =
    size === "compact" || size === "mobile" ? "h-4 w-4 left-3" : "h-5 w-5 left-4";
  const btnSize =
    size === "large"
      ? "h-10 min-w-10 px-3 sm:h-11 sm:min-w-[6.5rem] sm:px-5"
      : size === "mobile"
        ? "min-h-[48px] px-4 py-2.5 text-sm"
        : size === "compact"
          ? "min-h-[44px] px-3 py-2"
          : "min-h-[48px] px-4 py-2 text-xs sm:text-sm";
  const isIntegrated = size === "large";
  const formLayout = isIntegrated
    ? "relative"
    : size === "compact"
      ? "flex items-stretch gap-2"
      : "flex flex-col gap-2.5 sm:flex-row sm:items-stretch";

  const showTextSubmit = size !== "compact" && !isIntegrated;
  const showCompactIconSubmit = size === "compact" || isIntegrated;

  const submitButton = (
    <button
      type="submit"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800",
        isIntegrated &&
          "absolute right-2 top-1/2 -translate-y-1/2 text-sm sm:right-2.5",
        showTextSubmit && cn("uppercase tracking-wide", cn("w-full sm:w-auto", btnSize)),
        showCompactIconSubmit && !isIntegrated && "h-11 min-h-[44px] w-11 min-w-[44px] touch-manipulation",
        isIntegrated && btnSize
      )}
      aria-label={submitLabel}
      title={submitLabel}
    >
      {showTextSubmit ? (
        submitLabel
      ) : isIntegrated ? (
        <>
          <Search className="h-5 w-5 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">{submitLabel}</span>
        </>
      ) : (
        <Search className="h-4 w-4" aria-hidden />
      )}
    </button>
  );

  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
        className={formLayout}
        role="search"
        aria-label={placeholder}
      >
        <div className={cn("relative min-w-0", !isIntegrated && "flex-1")}>
          <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/50", iconSize)} aria-hidden />
          <input
            type="search"
            name="q"
            autoComplete="off"
            enterKeyHint="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label={placeholder}
            className={cn(
              "input-base w-full rounded-2xl shadow-md",
              inputSize,
              onDark && "border-white/10 bg-white/5 text-white placeholder:text-white/45"
            )}
          />
          {isIntegrated && submitButton}
        </div>
        {!isIntegrated && submitButton}
      </form>
      {hint && size !== "compact" && size !== "mobile" && (
        <p
          className={cn(
            "mt-2 text-pretty text-sm font-semibold leading-relaxed text-white/75"
          )}
        >
          {hint}
        </p>
      )}
      {open && visibleSuggestions.length > 0 && (
        <ul
          className="animate-slide-down absolute z-[70] mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-white/10 bg-[hsl(0_0%_6%/0.98)] py-1 shadow-card-hover backdrop-blur-2xl"
          role="listbox"
        >
          {visibleSuggestions.map((s, i) => {
            const Icon = icons[s.type];
            return (
              <li key={`${s.type}-${s.slug}-${i}`} role="option" aria-selected={false}>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-[48px] w-full touch-manipulation items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-white/10",
                    s.type === "submit-case" && "bg-red-950/20 hover:bg-red-950/35"
                  )}
                  onClick={() => goSuggestion(s)}
                >
                  <Icon className="h-5 w-5 shrink-0 text-red-300" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-white">{s.label}</span>
                    {s.meta && <span className="ml-2 font-medium text-white/60">{s.meta}</span>}
                  </span>
                  <span className="shrink-0 text-xs capitalize text-white/50">
                    {s.type === "victim" ? "patient" : s.type === "submit-case" ? "form" : s.type}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
