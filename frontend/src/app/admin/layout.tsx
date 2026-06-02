import { SessionProvider } from "next-auth/react";
import { AdminFeedbackProvider } from "@/components/admin/AdminFeedbackProvider";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
    </SessionProvider>
  );
}
