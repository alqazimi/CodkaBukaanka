"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FileText, Building2, User, Stethoscope, Pill, Inbox, Users, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Cases", icon: FileText },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/patients", label: "Patients", icon: User },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medications", label: "Medications", icon: Pill },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
  { href: "/admin/admins", label: "Admins", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  async function handleSignOut() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      await signOut({ callbackUrl: "/admin/login" });
    }
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-navy-800/70 bg-gradient-to-b from-navy-950 to-navy-900 text-white">
      <div className="border-b border-navy-800/80 p-4">
        <Link href="/admin" className="font-serif text-lg font-semibold tracking-tight">Admin Panel</Link>
        <p className="text-xs uppercase tracking-[0.14em] text-navy-400">CodkaBukaanka</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm"
                : "text-navy-300 hover:bg-navy-800/80"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-navy-800 p-3">
        <Link href="/en" className="mb-2 block text-xs text-navy-400 hover:text-white">← View public site</Link>
        <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-300 hover:bg-navy-800">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
