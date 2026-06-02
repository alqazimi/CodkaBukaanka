import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function LocaleNotFoundPage() {
  const locale = await getLocale();
  const isSo = locale === "so";

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl font-bold text-navy-900">404</h1>
      <p className="mt-4 text-lg text-navy-700">
        {isSo ? "Boggan lama helin." : "This page could not be found."}
      </p>
      <p className="mt-2 text-sm text-navy-500">
        {isSo
          ? "Waxaad dib ugu laaban kartaa bogga hore ee kaydka."
          : "You can return to the archive home page."}
      </p>
      <Link href="/" locale={locale} className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
        {isSo ? "Ku noqo bogga hore" : "Back to home"}
      </Link>
    </div>
  );
}
