import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FilePlus2 } from "lucide-react";

export async function SearchSubmitCasePrompt({ className = "" }: { className?: string }) {
  const t = await getTranslations("search");

  return (
    <div
      className={`card-surface min-w-0 border-red-400/25 bg-red-950/15 p-5 sm:p-6 ${className}`}
    >
      <div className="flex gap-3 sm:gap-4">
        <FilePlus2 className="mt-0.5 h-6 w-6 shrink-0 text-red-400" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-bold text-white sm:text-xl">{t("submitCaseTitle")}</h2>
          <p className="mt-2 text-pretty text-sm font-medium leading-relaxed text-white/75 sm:text-base">
            {t("submitCaseText")}
          </p>
          <Link
            href="/submit-case"
            prefetch
            className="mt-4 inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800"
          >
            {t("submitCaseCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
