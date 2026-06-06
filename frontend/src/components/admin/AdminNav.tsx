"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  User,
  Stethoscope,
  Pill,
  Inbox,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ScrollText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicApiUrl } from "@/lib/env";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminLocaleToggle, AdminPublicSiteLink } from "@/components/admin/AdminLocaleToggle";
import { AdminInboxBadge } from "@/components/admin/AdminInboxBadge";

const baseLinks: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
  ownerOnly?: boolean;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Cases", icon: FileText },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/patients", label: "Patients", icon: User },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medications", label: "Medications", icon: Pill },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox, badge: true },
  { href: "/admin/recycle-bin", label: "Recycle bin", icon: Trash2, ownerOnly: true },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
  { href: "/admin/admins", label: "Admins", icon: Users },
];

function NavLinks({ onNavigate, isOwner }: { onNavigate?: () => void; isOwner: boolean }) {
  const pathname = usePathname();
  const links = baseLinks.filter((link) => !link.ownerOnly || isOwner);

  return (
    <>
      {links.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm"
                : "text-navy-300 hover:bg-navy-800/80 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {badge && <AdminInboxBadge />}
          </Link>
        );
      })}
    </>
  );
}

/** Language + day/night — one place per breakpoint (mobile top bar OR desktop sidebar). */
function AdminSettingsControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AdminLocaleToggle variant="bar" showLabel />
      <ThemeToggle variant="admin" />
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isOwner = (session?.user as { role?: string } | undefined)?.role === "owner";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSignOut() {
    try {
      await fetch(`${getPublicApiUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      await signOut({ callbackUrl: "/admin/login" });
    }
  }

  return (
    <>
      {/* Mobile top bar — only language + theme controls on small screens */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-navy-800/80 bg-navy-950 px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-200 hover:bg-navy-800"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="font-serif text-base font-semibold tracking-tight">
          Admin
        </Link>
        <AdminSettingsControls />
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[min(100vw-2.5rem,17.5rem)] flex-col border-r border-navy-800/70 bg-gradient-to-b from-navy-950 to-navy-900 text-white shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-navy-800/80 p-4 lg:block">
          <div>
            <Link href="/admin" className="font-serif text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>
              Admin Panel
            </Link>
            <p className="text-[10px] uppercase tracking-[0.14em] text-navy-400">CodkaBukaanka</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-300 hover:bg-navy-800 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          <NavLinks onNavigate={() => setOpen(false)} isOwner={isOwner} />
        </nav>

        <div className="border-t border-navy-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Desktop only — mobile uses top bar above */}
          <div className="mb-3 hidden rounded-xl bg-navy-800/50 px-3 py-3 lg:block">
            <p className="mb-2 text-xs font-medium text-navy-400">Language & appearance</p>
            <AdminSettingsControls className="justify-start" />
          </div>

          <AdminPublicSiteLink className="mb-2" onNavigate={() => setOpen(false)} />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-navy-300 hover:bg-navy-800"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
