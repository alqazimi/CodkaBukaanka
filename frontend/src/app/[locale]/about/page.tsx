import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  FilePlus,
  FileText,
  Layers,
  Mail,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { LEGAL_ENTITY } from "@/content/legal/entity";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/about",
  });
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

      <section className="section-alt py-16 sm:py-20">
        <div className="page-container py-0">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
            <article className="glass-panel flex h-full flex-col overflow-hidden border-red-400/25 shadow-[var(--shadow-elite)]">
              <div className="relative border-b border-white/10 bg-[linear-gradient(135deg,hsl(0_84%_55%/0.12),transparent_55%)] px-6 py-8 sm:px-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/35 bg-red-500/10 shadow-[var(--shadow-red-soft)]">
                  <FilePlus className="h-6 w-6 text-red-300" aria-hidden />
                </span>
                <p className="hero-badge mt-5 w-fit">{t("submitCaseBadge")}</p>
                <h2 className="section-title mt-3 text-xl sm:text-2xl">{t("submitCaseTitle")}</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                  {t("submitCaseText")}
                </p>
              </div>

              <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
                <ul className="grid gap-3">
                  {[t("submitCasePoint1"), t("submitCasePoint2"), t("submitCasePoint3")].map((point) => (
                    <li
                      key={point.slice(0, 24)}
                      className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm font-medium leading-snug text-white/75"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex justify-start pt-8">
                  <Button
                    href="/submit-case"
                    variant="primary"
                    className="min-h-[48px] w-full justify-center gap-2 sm:min-h-[44px] sm:w-auto"
                  >
                    {t("submitCaseButton")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </article>

            <article className="glass-panel flex h-full flex-col overflow-hidden border-white/10 shadow-[var(--shadow-elite)]">
              <div className="relative border-b border-white/10 bg-[linear-gradient(135deg,hsl(0_0%_100%/0.04),transparent_55%)] px-6 py-8 sm:px-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                  <Mail className="h-6 w-6 text-red-300" aria-hidden />
                </span>
                <p className="hero-badge mt-5 w-fit">{t("contactSectionBadge")}</p>
                <h2 className="section-title mt-3 text-xl sm:text-2xl">{t("contactSectionTitle")}</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                  {t("contactSectionText")}
                </p>
              </div>

              <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
                <div className="flex-1" aria-hidden />

                <div className="flex justify-end">
                  <Button
                    href="/contact"
                    variant="outline"
                    className="min-h-[48px] w-full justify-center gap-2 sm:min-h-[44px] sm:w-auto"
                  >
                    <Mail className="h-4 w-4 text-red-300" aria-hidden />
                    {t("contactButton")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6">
                  <p className="text-sm font-medium leading-relaxed text-white/65">
                    {t("otherContactHint")}{" "}
                    <Link href="/corrections" prefetch className="link-theme font-semibold underline underline-offset-2">
                      {t("correctionsLink")}
                    </Link>
                  </p>
                  <Link
                    href="/search"
                    prefetch
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
                  >
                    <Search className="h-4 w-4 text-red-400" aria-hidden />
                    {t("searchArchive")}
                    <ArrowRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </Link>
                </div>

                <p className="mt-6 border-t border-white/5 pt-4 text-xs font-medium tracking-wide text-subtle">
                  {LEGAL_ENTITY.platformName} · {LEGAL_ENTITY.contactLocation}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
