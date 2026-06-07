"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function SearchQuickExamples({ onDark: _onDark = false }: { onDark?: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const examples = t.raw("examples") as string[];

  if (!Array.isArray(examples) || examples.length === 0) return null;

  const labelClass = "text-white/75";
  const chipClass =
    "border-white/10 bg-white/5 text-white hover:border-red-400/45 hover:bg-white/10 backdrop-blur-md";

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
