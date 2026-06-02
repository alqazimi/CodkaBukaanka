import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";

export default async function CorrectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{t("correctionsTitle")}</h1>
      <p className="mt-4 text-navy-600">
        Submit factual correction requests with supporting documentation references. All requests
        are reviewed by administrators.
      </p>
      <div className="mt-8">
        <ContactForm type="correction" />
      </div>
    </div>
  );
}
