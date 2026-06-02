"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { Search, Building2, User, FileText, Stethoscope, Pill } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Suggestion = {
  type: "hospital" | "patient" | "doctor" | "medication" | "case" | "victim";
  label: string;
  slug: string;
  meta?: string;
};

export function GlobalSearchBar({
  placeholder,
  defaultValue = "",
  className = "",
  submitLabel = "Search",
  hint,
  size = "default",
}: {
  placeholder: string;
  defaultValue?: string;
  className?: string;
  submitLabel?: string;
  hint?: string;
  size?: "default" | "compact" | "large" | "mobile";
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        const res = await fetch(`${getApiBaseUrl()}/api/search/suggest?q=${encodeURIComponent(q)}`);
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
  };

  const iconOnlySubmit = size === "mobile";

  const inputSize =
    size === "large"
      ? "min-h-[56px] py-4 pl-12 pr-32 text-base sm:text-lg"
      : size === "mobile"
        ? "min-h-[48px] py-3 pl-11 pr-14 text-base"
        : size === "compact"
          ? "min-h-[44px] py-2.5 pl-10 pr-24 text-sm"
          : "min-h-[52px] py-3.5 pl-12 pr-28 text-base";

  const iconSize =
    size === "compact" || size === "mobile" ? "h-4 w-4 left-3" : "h-5 w-5 left-4";
  const btnSize =
    size === "large"
      ? "px-5 py-2.5 text-sm"
      : iconOnlySubmit
        ? "h-10 w-10 p-0"
        : size === "compact"
          ? "px-3 py-1.5 text-[11px]"
          : "px-4 py-2 text-xs";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
        className="relative"
        role="search"
        aria-label={placeholder}
      >
        <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-navy-400", iconSize)} aria-hidden />
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
            "input-base w-full rounded-2xl border-navy-200/90 shadow-md",
            inputSize
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 font-semibold uppercase tracking-wide text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700",
            iconOnlySubmit ? btnSize : cn("min-h-[40px]", btnSize)
          )}
          aria-label={submitLabel}
        >
          {iconOnlySubmit ? <Search className="h-5 w-5" aria-hidden /> : submitLabel}
        </button>
      </form>
      {hint && size !== "compact" && size !== "mobile" && (
        <p className="mt-2 text-sm text-navy-600/90 dark:text-navy-400">{hint}</p>
      )}
      {open && suggestions.length > 0 && (
        <ul
          className="animate-slide-down absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-navy-100 bg-white py-1 shadow-card-hover dark:border-navy-700 dark:bg-navy-900"
          role="listbox"
        >
          {suggestions.map((s, i) => {
            const Icon = icons[s.type];
            return (
              <li key={`${s.type}-${s.slug}-${i}`} role="option">
                <button
                  type="button"
                  className="flex min-h-[48px] w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-teal-50/60 dark:hover:bg-navy-800"
                  onClick={() => goSuggestion(s)}
                >
                  <Icon className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-navy-900 dark:text-navy-100">{s.label}</span>
                    {s.meta && <span className="ml-2 text-navy-500 dark:text-navy-400">{s.meta}</span>}
                  </span>
                  <span className="shrink-0 text-xs capitalize text-navy-400 dark:text-navy-500">
                    {s.type === "victim" ? "patient" : s.type}
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
