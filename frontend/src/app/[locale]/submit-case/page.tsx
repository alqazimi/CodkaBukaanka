import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { CaseSubmissionForm } from "@/components/forms/CaseSubmissionForm";
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("submitCaseTitle"), description: t("submitCaseDescription") };
}

export default async function SubmitCasePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const about = await getTranslations("about");

  return (
    <div className="page-container">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t("submitCaseTitle")} description={t("submitCaseDescription")} />

        <div className="card-surface p-6 sm:p-8">
          <CaseSubmissionForm />
        </div>

        <p className="mt-6 text-sm font-medium text-subtle">
          {about("otherContactHint")}{" "}
          <Link href="/contact" prefetch className="link-theme underline">
            {about("contactLink")}
          </Link>
          {" · "}
          <Link href="/about" prefetch className="link-theme underline">
            {about("title")}
          </Link>
        </p>
      </div>
    </div>
  );
}
