import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Search, MousePointerClick, FileText, Building2, Users, FolderOpen } from "lucide-react";

export async function HomeSearchGuide() {
  const t = await getTranslations("home");

  const steps = [
    { num: 1, title: t("step1Title"), text: t("step1Text"), icon: Search },
    { num: 2, title: t("step2Title"), text: t("step2Text"), icon: MousePointerClick },
    { num: 3, title: t("step3Title"), text: t("step3Text"), icon: FileText },
  ];

  const browse = [
    { href: "/search", title: t("browseSearch"), desc: t("browseSearchDesc"), icon: Search, primary: true },
    { href: "/hospitals", title: t("browseHospitals"), desc: t("browseHospitalsDesc"), icon: Building2 },
    { href: "/patients", title: t("browsePatients"), desc: t("browsePatientsDesc"), icon: Users },
    { href: "/search", title: t("browseCases"), desc: t("browseCasesDesc"), icon: FolderOpen },
  ];

  return (
    <section className="section-alt py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">{t("guideTitle")}</h2>
        <p className="section-subtitle">{t("guideIntro")}</p>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(({ num, title, text, icon: Icon }) => (
            <li
              key={num}
              className="card-interactive flex min-w-0 gap-4 p-5 sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/35 bg-white/10 text-lg font-bold text-red-200 backdrop-blur-md">
                {num}
              </span>
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-red-300" aria-hidden />
                  <h3 className="font-serif text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-white/75">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14">
          <h2 className="section-title">{t("browseTitle")}</h2>
          <p className="section-subtitle">{t("browseSubtitle")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {browse.map((item) => (
              <Link
                key={item.href + item.title}
                href={item.href}
                prefetch
                className={
                  item.primary
                    ? "card-interactive flex min-h-[120px] flex-col justify-center border-red-400/40 p-5"
                    : "card-interactive flex min-h-[120px] flex-col justify-center p-5"
                }
              >
                <item.icon className="h-8 w-8 text-red-300" aria-hidden />
                <span className="mt-3 font-serif text-lg font-semibold text-white">{item.title}</span>
                <span className="mt-1 text-sm text-white/75">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
