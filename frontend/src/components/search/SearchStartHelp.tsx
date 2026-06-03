import { getTranslations } from "next-intl/server";
import { Search, Filter } from "lucide-react";

export async function SearchStartHelp() {
  const t = await getTranslations("search");

  const tips = [
    { icon: Search, text: t("startTip1") },
    { icon: Filter, text: t("startTip2") },
  ];

  return (
    <div className="card-surface min-w-0 border-teal-200/60 bg-teal-50/40 p-5 sm:p-6 lg:p-8 dark:border-teal-800/40 dark:bg-teal-950/20">
      <h2 className="font-serif text-lg font-semibold text-navy-950 sm:text-xl dark:text-navy-50">{t("startTitle")}</h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-navy-700 sm:text-base dark:text-navy-300">{t("startText")}</p>
      <ul className="mt-5 space-y-3 sm:mt-6">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm text-navy-700 sm:text-base dark:text-navy-300">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
            <span className="min-w-0 text-pretty">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
