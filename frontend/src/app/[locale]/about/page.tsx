import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/routing";
import { LEGAL_ENTITY } from "@/content/legal/entity";
import { ShieldCheck, Search, FileText, AlertCircle } from "lucide-react";

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
  const documentTypes = [t("documentItem1"), t("documentItem2"), t("documentItem3"), t("documentItem4"), t("documentItem5")];
  const notItems = [t("notItem1"), t("notItem2"), t("notItem3"), t("notItem4")];

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mx-auto max-w-3xl space-y-10">
        <section className="prose-archive">
          <h2>{t("whatTitle")}</h2>
          <p>{t("whatText")}</p>
        </section>

        <section className="prose-archive">
          <h2>{t("missionTitle")}</h2>
          <p>{t("missionText")}</p>
        </section>

        <section>
          <h2 className="section-title">{t("principlesTitle")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card-interactive p-5">
                <Icon className="h-6 w-6 text-red-300" aria-hidden />
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prose-archive">
          <h2>{t("documentsTitle")}</h2>
          <p>{t("documentsIntro")}</p>
          <ul>
            {documentTypes.map((item) => (
              <li key={item.slice(0, 32)}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="prose-archive">
          <h2>{t("processTitle")}</h2>
          <p>{t("processIntro")}</p>
          <ol>
            {processSteps.map((step) => (
              <li key={step.slice(0, 32)}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="glass-panel border-red-400/35 p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden />
            <div className="prose-archive min-w-0">
              <h2 className="!mt-0">{t("notTitle")}</h2>
              <ul className="!mb-0">
                {notItems.map((item) => (
                  <li key={item.slice(0, 32)}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="prose-archive">
          <h2>{t("contactTitle")}</h2>
          <p>{t("contactText")}</p>
          <p>
            <Link href="/contact">{t("contactLink")}</Link>
            {" · "}
            <Link href="/corrections">{t("correctionsLink")}</Link>
          </p>
          <p className="text-sm text-white/60">
            {LEGAL_ENTITY.platformName} · {LEGAL_ENTITY.contactLocation}
          </p>
        </section>
      </div>
    </div>
  );
}
