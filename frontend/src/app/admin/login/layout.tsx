/** Per-request CSP nonces require dynamic rendering (static prerender breaks admin login JS). */
export const dynamic = "force-dynamic";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
