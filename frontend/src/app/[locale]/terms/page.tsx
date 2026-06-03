import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="page-container-narrow prose-archive animate-fade-in">
      <h1>{t("termsTitle")}</h1>
      <div className="mt-8 space-y-4">
        <p>
          By using CodkaBukaanka, you agree that this website is a documentation archive, not
          a platform for medical advice, legal representation, or emergency services.
        </p>
        <h2>No User Submissions</h2>
        <p>
          Visitors cannot create accounts, submit reports, upload media, or post comments. All
          archive content is administrator-managed.
        </p>
        <h2>Disclaimer</h2>
        <p>
          Publication of any report does not constitute a legal determination of liability,
          negligence, or wrongdoing by any person or institution named in the archive.
        </p>
        <h2>Acceptable Use</h2>
        <p>
          You may not attempt to disrupt the service, scrape content at abusive rates, or use
          archive information to harass individuals named in reports.
        </p>
      </div>
    </div>
  );
}
