import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RoutePrefetcher } from "@/components/layout/RoutePrefetcher";
import { LocaleHtmlLang } from "@/components/layout/LocaleHtmlLang";
import { StaticSiteBackground } from "@/components/layout/StaticSiteBackground";
import { ScrollNav } from "@/components/layout/ScrollNav";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { SiteTrustJsonLd } from "@/components/layout/SiteTrustJsonLd";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "so")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtmlLang locale={locale} />
      <SiteTrustJsonLd />
      <StaticSiteBackground />
      <NavigationProgress />
      <Header />
      <div className="relative z-[1] flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <RoutePrefetcher />
        <main className="flex-1 pt-[var(--site-header-height,4rem)]">{children}</main>
        <Footer />
        <ScrollNav />
      </div>
    </NextIntlClientProvider>
  );
}
