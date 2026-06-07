import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { LEGAL_ENTITY } from "@/content/legal/entity";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="page-container">
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("contactTitle")} description={t("contactDescription")} />

        <div className="mb-6 card-surface p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{t("contactEmailLabel")}</p>
          <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} className="mt-2 inline-block font-serif text-lg font-bold text-white link-theme">
            {LEGAL_ENTITY.contactEmail}
          </a>
          <p className="mt-3 text-sm font-medium leading-relaxed text-white/70">{t("contactInboxNote")}</p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <ContactForm type="contact" />
        </div>
      </div>
    </div>
  );
}
