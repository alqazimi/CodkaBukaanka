import { getTranslations } from "next-intl/server";
import { Search, Filter } from "lucide-react";

export async function SearchStartHelp() {
  const t = await getTranslations("search");

  const tips = [
    { icon: Search, text: t("startTip1") },
    { icon: Filter, text: t("startTip2") },
  ];

  return (
    <div className="card-surface min-w-0 border-teal-400/20 bg-teal-500/5 p-5 sm:p-6 lg:p-8">
      <h2 className="font-serif text-lg font-semibold text-white sm:text-xl">{t("startTitle")}</h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-white/70 sm:text-base">{t("startText")}</p>
      <ul className="mt-5 space-y-3 sm:mt-6">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm text-white/75 sm:text-base">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" aria-hidden />
            <span className="min-w-0 text-pretty">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
