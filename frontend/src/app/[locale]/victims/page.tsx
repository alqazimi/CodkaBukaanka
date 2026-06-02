import { redirect } from "@/i18n/routing";

export default async function VictimsRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/patients", locale });
}
