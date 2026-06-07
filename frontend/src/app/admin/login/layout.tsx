import type { Metadata } from "next";

/** Per-request CSP nonces require dynamic rendering (static prerender breaks admin login JS). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign-in",
  description: "Official CodkaBukaanka editorial staff sign-in. Public visitors do not need an account.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
