"use client";

import { SessionProvider } from "next-auth/react";
import { AdminSessionRefresh } from "@/components/admin/AdminSessionRefresh";

/** Session polling only inside the admin panel — not on the login page. */
export function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <AdminSessionRefresh />
      {children}
    </SessionProvider>
  );
}
