"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Building2,
  User,
  Stethoscope,
  Pill,
  Inbox,
  Users,
  LogOut,
  Menu,
  X,
  ScrollText,
  Trash2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminOwner } from "@/lib/admin-role";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { navigateAfterLogout } from "@/lib/admin-router";
import { AdminLocaleToggle, AdminPublicSiteLink } from "@/components/admin/AdminLocaleToggle";
import { AdminInboxBadge } from "@/components/admin/AdminInboxBadge";
import { AdminSubmissionsBadge } from "@/components/admin/AdminSubmissionsBadge";

const baseLinks: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: boolean | "submissions";
  ownerOnly?: boolean;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Cases", icon: FileText },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/patients", label: "Patients", icon: User },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medications", label: "Medications", icon: Pill },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox, badge: true },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardList, badge: "submissions" as const },
  { href: "/admin/recycle-bin", label: "Recycle bin", icon: Trash2, ownerOnly: true },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/admins", label: "Admins", icon: Users },
  { href: "/admin/security", label: "Security Center", icon: Shield },
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
            prefetch
            onClick={onNavigate}
            className={cn(
              "admin-nav-item",
              active && "admin-nav-item--active"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {badge === "submissions" ? <AdminSubmissionsBadge /> : badge ? <AdminInboxBadge /> : null}
          </Link>
        );
      })}
    </>
  );
}

function AdminSettingsControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AdminLocaleToggle variant="bar" showLabel />
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isOwner = isAdminOwner((session?.user as { role?: string } | undefined)?.role);

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
      await fetch("/api/admin-proxy/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Still clear NextAuth below.
    } finally {
      await signOut({ redirect: false });
      navigateAfterLogout();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-white/5 px-4 backdrop-blur-2xl lg:hidden">
        <div className="header-accent" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mobile-menu-trigger relative z-[80] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/admin" className="font-serif text-base font-bold tracking-tight text-white">
          Admin
        </Link>
        <AdminSettingsControls />
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[min(100vw-2.5rem,17.5rem)] flex-col border-r border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
        )}
      >
        <div className="relative flex items-center justify-between border-b border-white/10 p-4 lg:block">
          <div className="header-accent" />
          <div>
            <Link href="/admin" className="font-serif text-lg font-bold tracking-tight text-white" onClick={() => setOpen(false)}>
              Admin Panel
            </Link>
            <SiteLogo size="sm" className="mt-0.5" />
          </div>
          <button
            type="button"
            className="mobile-menu-trigger lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          <NavLinks onNavigate={() => setOpen(false)} isOwner={isOwner} />
        </nav>

        <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 hidden rounded-xl border border-white/10 bg-white/5 px-3 py-3 lg:block">
            <p className="mb-2 text-xs font-semibold text-white/50">Language</p>
            <AdminSettingsControls className="justify-start" />
          </div>

          <AdminPublicSiteLink className="mb-2" onNavigate={() => setOpen(false)} />
          <button
            type="button"
            onClick={handleSignOut}
            className="admin-nav-item w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
