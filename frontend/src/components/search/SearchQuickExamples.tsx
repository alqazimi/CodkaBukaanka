"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function SearchQuickExamples({ onDark = false }: { onDark?: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const examples = t.raw("examples") as string[];

  if (!Array.isArray(examples) || examples.length === 0) return null;

  const labelClass = onDark ? "text-navy-100/90" : "text-navy-700 dark:text-navy-300";
  const chipClass = onDark
    ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
    : "border-teal-200 bg-teal-50 text-teal-900 hover:border-teal-400 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/60";

  return (
    <div className="mt-3 min-w-0">
      <p className={cn("text-pretty text-sm font-medium", labelClass)}>{t("tryExamples")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {examples.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
            className={cn(
              "min-h-[40px] rounded-full border px-3.5 py-2 text-sm font-medium transition-colors sm:min-h-[44px] sm:px-4",
              chipClass
            )}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
