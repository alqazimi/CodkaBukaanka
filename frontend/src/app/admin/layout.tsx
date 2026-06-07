import { SessionProvider } from "next-auth/react";
import { AdminFeedbackProvider } from "@/components/admin/AdminFeedbackProvider";
import { StaticSiteBackground } from "@/components/layout/StaticSiteBackground";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <AdminFeedbackProvider>
        <StaticSiteBackground />
        <div className="admin-shell relative z-[1] min-h-screen min-w-0">{children}</div>
      </AdminFeedbackProvider>
    </SessionProvider>
  );
}
