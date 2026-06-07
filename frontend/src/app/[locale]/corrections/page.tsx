import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CorrectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="page-container">
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("correctionsTitle")} description={t("correctionsDescription")} />
        <div className="card-surface p-6 sm:p-8">
          <ContactForm type="correction" />
        </div>
      </div>
    </div>
  );
}
