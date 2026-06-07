import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { LEGAL_ENTITY } from "@/content/legal/entity";
import {
  ShieldCheck,
  Search,
  FileText,
  AlertCircle,
  Pill,
  Stethoscope,
  Building2,
  Layers,
  Activity,
  Mail,
  PenLine,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const principles = [
    { icon: ShieldCheck, title: t("principle1Title"), text: t("principle1Text") },
    { icon: Search, title: t("principle2Title"), text: t("principle2Text") },
    { icon: FileText, title: t("principle3Title"), text: t("principle3Text") },
  ];

  const processSteps = [t("processStep1"), t("processStep2"), t("processStep3"), t("processStep4")];

  const documentTypes = [
    { icon: Pill, text: t("documentItem1") },
    { icon: Stethoscope, text: t("documentItem2") },
    { icon: Activity, text: t("documentItem3") },
    { icon: Building2, text: t("documentItem4") },
    { icon: Layers, text: t("documentItem5") },
  ];

  const notItems = [t("notItem1"), t("notItem2"), t("notItem3"), t("notItem4")];

  return (
    <>
      <div className="page-container">
        <PageHeader title={t("title")} description={t("description")} />

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="card-surface p-6 sm:p-8">
            <h2 className="section-title text-xl sm:text-2xl">{t("whatTitle")}</h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75 sm:text-base">{t("whatText")}</p>
          </article>
          <article className="card-surface p-6 sm:p-8">
            <h2 className="section-title text-xl sm:text-2xl">{t("missionTitle")}</h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75 sm:text-base">{t("missionText")}</p>
          </article>
        </div>
      </div>

      <section className="section-alt py-14 sm:py-16">
        <div className="page-container py-0">
          <h2 className="section-title">{t("principlesTitle")}</h2>
          <p className="section-subtitle">{t("principlesSubtitle")}</p>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="card-interactive flex min-w-0 gap-4 p-5 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/35 bg-white/10 text-lg font-bold text-red-200 backdrop-blur-md">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-red-300" aria-hidden />
                    <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="page-container">
        <h2 className="section-title">{t("documentsTitle")}</h2>
        <p className="section-subtitle">{t("documentsIntro")}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {documentTypes.map(({ icon: Icon, text }) => (
            <li key={text.slice(0, 32)} className="card-interactive flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-white/5">
                <Icon className="h-5 w-5 text-red-300" aria-hidden />
              </span>
              <p className="min-w-0 text-sm font-medium leading-relaxed text-white/80 sm:text-base">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <section className="section-alt py-14 sm:py-16">
        <div className="page-container py-0">
          <h2 className="section-title">{t("processTitle")}</h2>
          <p className="section-subtitle">{t("processIntro")}</p>

          <ol className="mt-10 grid gap-5 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <li key={step.slice(0, 32)} className="card-interactive flex gap-4 p-5 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/35 bg-white/10 text-lg font-bold text-red-200 backdrop-blur-md">
                  {index + 1}
                </span>
                <p className="min-w-0 pt-2 text-sm font-medium leading-relaxed text-white/80 sm:text-base">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="page-container">
        <div className="glass-panel border-red-400/35 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/35 bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-300" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="section-title text-xl sm:text-2xl">{t("notTitle")}</h2>
              <ul className="mt-5 space-y-3">
                {notItems.map((item) => (
                  <li key={item.slice(0, 32)} className="flex gap-3 text-sm font-medium leading-relaxed text-white/75 sm:text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/80" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="section-alt py-14 sm:py-16">
        <div className="page-container py-0">
          <h2 className="section-title">{t("contactTitle")}</h2>
          <p className="section-subtitle">{t("contactText")}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/contact" prefetch className="card-interactive group flex min-h-[140px] flex-col justify-between border-red-400/40 p-6">
              <div>
                <Mail className="h-8 w-8 text-red-300" aria-hidden />
                <span className="mt-4 block font-serif text-lg font-bold text-white">{t("contactLink")}</span>
                <span className="mt-1 block text-sm font-medium text-white/70">{t("contactCardDesc")}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-red-200 transition-colors group-hover:text-white">
                {t("openForm")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>

            <Link href="/corrections" prefetch className="card-interactive group flex min-h-[140px] flex-col justify-between p-6">
              <div>
                <PenLine className="h-8 w-8 text-red-300" aria-hidden />
                <span className="mt-4 block font-serif text-lg font-bold text-white">{t("correctionsLink")}</span>
                <span className="mt-1 block text-sm font-medium text-white/70">{t("correctionsCardDesc")}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-red-200 transition-colors group-hover:text-white">
                {t("openForm")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-subtle">
              {LEGAL_ENTITY.platformName} · {LEGAL_ENTITY.contactLocation}
            </p>
            <Button href="/search" variant="outline">
              {t("searchArchive")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
