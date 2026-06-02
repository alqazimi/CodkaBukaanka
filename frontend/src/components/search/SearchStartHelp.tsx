import { getTranslations } from "next-intl/server";
import { Search, Filter, ShieldCheck } from "lucide-react";

export async function SearchStartHelp() {
  const t = await getTranslations("search");

  const tips = [
    { icon: Search, text: t("startTip1") },
    { icon: Filter, text: t("startTip2") },
    { icon: ShieldCheck, text: t("startText") },
  ];

  return (
    <div className="card-surface border-teal-200/60 bg-teal-50/40 p-6 sm:p-8 dark:border-teal-800/40 dark:bg-teal-950/20">
      <h2 className="font-serif text-xl font-semibold text-navy-950 dark:text-navy-50">{t("startTitle")}</h2>
      <p className="mt-2 text-base leading-relaxed text-navy-700 dark:text-navy-300">{t("startText")}</p>
      <ul className="mt-6 space-y-3">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm text-navy-700 dark:text-navy-300 sm:text-base">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
