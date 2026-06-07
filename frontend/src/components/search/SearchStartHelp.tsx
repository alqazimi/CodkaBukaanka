import { getTranslations } from "next-intl/server";
import { Search, Filter } from "lucide-react";
import { SearchSubmitCasePrompt } from "@/components/search/SearchSubmitCasePrompt";

export async function SearchStartHelp() {
  const t = await getTranslations("search");

  const tips = [
    { icon: Search, text: t("startTip1") },
    { icon: Filter, text: t("startTip2") },
  ];

  return (
    <div className="space-y-5">
      <div className="card-surface min-w-0 border-red-400/20 bg-red-950/10 p-5 sm:p-6 lg:p-8">
        <h2 className="font-serif text-lg font-bold text-white sm:text-xl">{t("startTitle")}</h2>
        <p className="mt-2 text-pretty text-sm font-medium leading-relaxed text-white/70 sm:text-base">
          {t("startText")}
        </p>
        <ul className="mt-5 space-y-3 sm:mt-6">
          {tips.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm font-medium text-white/75 sm:text-base">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
              <span className="min-w-0 text-pretty">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <SearchSubmitCasePrompt />
    </div>
  );
}
