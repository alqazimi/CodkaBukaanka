import { AdminNav } from "@/components/admin/AdminNav";
import { AdminIdleLogout } from "@/components/admin/AdminIdleLogout";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy-50">
      <AdminIdleLogout />
      <AdminNav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
