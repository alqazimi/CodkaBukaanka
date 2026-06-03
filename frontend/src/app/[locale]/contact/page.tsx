import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="page-container animate-fade-in">
      <div className="mx-auto max-w-xl">
        <PageHeader
          title={t("contactTitle")}
          description="For archive inquiries, media requests, or general contact. We do not accept report submissions through this form."
        />
        <div className="card-surface p-6 sm:p-8">
          <ContactForm type="contact" />
        </div>
      </div>
    </div>
  );
}
