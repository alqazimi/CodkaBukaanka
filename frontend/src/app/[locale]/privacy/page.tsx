import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 prose-archive">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{t("privacyTitle")}</h1>
      <div className="mt-8 space-y-4 text-navy-700">
        <p>
          CodkaBukaanka collects and publishes documented healthcare incident reports verified
          by administrators. We do not allow public account registration or user-submitted reports.
        </p>
        <h2 className="text-xl font-semibold text-navy-900">Information We Collect</h2>
        <p>
          Contact and correction request forms collect name, email, and message content solely for
          administrative review. Server logs may record IP addresses for security and rate limiting.
        </p>
        <h2 className="text-xl font-semibold text-navy-900">Published Reports</h2>
        <p>
          Published archive content is compiled from offline-verified evidence. Personal identifiers
          may be redacted prior to publication at administrator discretion.
        </p>
        <h2 className="text-xl font-semibold text-navy-900">Your Rights</h2>
        <p>
          You may request corrections via our corrections form. We review all requests but cannot
          guarantee changes without supporting documentation.
        </p>
      </div>
    </div>
  );
}
