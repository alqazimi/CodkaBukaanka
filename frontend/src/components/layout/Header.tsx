"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DesktopHeaderSearch, MobileHeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import {
  shouldShowHeaderSearchBar,
} from "@/components/layout/header-search-mode";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const t = useTranslations("nav");
  const tSite = useTranslations("site");
  const tTheme = useTranslations("theme");
  const pathname = usePathname();
  const showHeaderSearch = shouldShowHeaderSearchBar(pathname);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/patients", label: t("patients") },
    { href: "/contact", label: t("contact") },
  ];

  const navLinkClass = (href: string) =>
    cn(
      "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors nav-link",
      isActive(pathname, href) && "nav-link-active"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/70 bg-white/95 backdrop-blur-xl dark:border-navy-800/70 dark:bg-navy-950/95">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" className="group shrink-0">
            <span className="block font-serif text-lg font-semibold tracking-tight text-navy-900 dark:text-white sm:text-xl">
              CodkaBukaanka
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.12em] text-navy-500 dark:text-navy-400 sm:block">
              {tSite("tagline")}
            </span>
          </Link>

          {showHeaderSearch && <DesktopHeaderSearch />}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="hidden items-center gap-1 lg:flex xl:gap-1.5" aria-label="Main">
              {links.map((link) => (
                <Link key={link.href} href={link.href} prefetch className={navLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
              <div className="ml-2 flex items-center gap-2 border-l border-navy-200/80 pl-3 dark:border-navy-700">
                <LocaleToggle compactLabel showLabel />
                <ThemeToggle
                  switchToLightLabel={tTheme("switchToLight")}
                  switchToDarkLabel={tTheme("switchToDark")}
                />
              </div>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <LocaleToggle showLabel={false} className="sm:hidden" />
              <LocaleToggle compactLabel showLabel className="hidden sm:inline-flex" />
              <ThemeToggle
                switchToLightLabel={tTheme("switchToLight")}
                switchToDarkLabel={tTheme("switchToDark")}
              />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-200/80 bg-white text-navy-700 transition-colors hover:bg-navy-50 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {showHeaderSearch && <MobileHeaderSearch />}

        <nav
          className={cn(
            "overflow-hidden border-t border-navy-100/80 bg-white transition-all duration-300 ease-smooth dark:border-navy-800 dark:bg-navy-950 lg:hidden",
            open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
          aria-label="Mobile menu"
        >
          <div className="space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  "block min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(pathname, link.href)
                    ? "bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                    : "text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800"
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
