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
}: {
  placeholder: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="input-base rounded-2xl border-navy-200/90 py-3.5 pl-12 pr-28 shadow-md"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700"
        >
          Search
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <ul className="animate-slide-down absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-navy-100 bg-white py-1 shadow-card-hover dark:border-navy-700 dark:bg-navy-900">
          {suggestions.map((s, i) => {
            const Icon = icons[s.type];
            return (
              <li key={`${s.type}-${s.slug}-${i}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-teal-50/60 dark:hover:bg-navy-800"
                  onClick={() => goSuggestion(s)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-teal-600" />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-navy-900 dark:text-navy-100">{s.label}</span>
                    {s.meta && <span className="ml-2 text-navy-500 dark:text-navy-400">{s.meta}</span>}
                  </span>
                  <span className="shrink-0 text-xs capitalize text-navy-400">{s.type === "victim" ? "patient" : s.type}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
