import { redirect } from "@/i18n/routing";

export default async function VictimDetailRedirectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  redirect({ href: `/patients/${slug}`, locale });
}
