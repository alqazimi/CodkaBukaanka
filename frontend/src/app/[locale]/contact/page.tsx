import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{t("contactTitle")}</h1>
      <p className="mt-4 text-navy-600">
        For archive inquiries, media requests, or general contact. We do not accept report
        submissions through this form.
      </p>
      <div className="mt-8">
        <ContactForm type="contact" />
      </div>
    </div>
  );
}
