"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DesktopHeaderSearch, MobileHeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleToggle } from "@/components/layout/LocaleToggle";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const t = useTranslations("nav");
  const tSite = useTranslations("site");
  const tTheme = useTranslations("theme");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/search", label: t("search"), short: t("searchShort") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/patients", label: t("patients") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/70 bg-white/95 backdrop-blur-xl dark:border-navy-800/70 dark:bg-navy-950/95">
      <div className="mx-auto max-w-7xl">
        {/* Main bar — one row on laptop (lg+) like desktop; compact on tablet */}
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:h-[4.25rem] lg:gap-4 lg:px-8">
          <Link href="/" className="group shrink-0 max-w-[9rem] sm:max-w-[11rem] lg:max-w-[12rem]">
            <span className="block truncate font-serif text-base font-semibold tracking-tight text-navy-900 dark:text-white sm:text-lg lg:text-xl">
              CodkaBukaanka
            </span>
            <span className="hidden truncate text-[10px] uppercase tracking-[0.14em] text-navy-500 dark:text-navy-400 xl:block">
              {tSite("tagline")}
            </span>
          </Link>

          {!isHome && <DesktopHeaderSearch />}

          {/* Laptop + desktop navigation (1024px+) — was xl-only before */}
          <nav
            className="hidden shrink-0 items-center gap-1.5 lg:flex xl:gap-2.5"
            aria-label="Main"
          >
            {links.map((link) => {
              const isSearch = link.href === "/search";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
                    isSearch &&
                      "rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm hover:opacity-95 xl:px-4",
                    !isSearch && "nav-link",
                    !isSearch && isActive(pathname, link.href) && "nav-link-active"
                  )}
                >
                  {isSearch && "short" in link ? (
                    <>
                      <span className="lg:inline xl:hidden">{link.short}</span>
                      <span className="hidden xl:inline">{link.label}</span>
                    </>
                  ) : (
                    link.label
                  )}
                </Link>
              );
            })}
            <div className="ml-1 flex items-center gap-1.5 border-l border-navy-200/80 pl-2 dark:border-navy-700 xl:ml-2 xl:gap-2 xl:pl-3">
              <LocaleToggle compactLabel className="lg:inline-flex xl:hidden" showLabel />
              <LocaleToggle className="hidden xl:inline-flex" showLabel />
              <ThemeToggle
                switchToLightLabel={tTheme("switchToLight")}
                switchToDarkLabel={tTheme("switchToDark")}
              />
            </div>
          </nav>

          {/* Phone + tablet: menu button (hidden on laptop lg+) */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
            <LocaleToggle showLabel={false} className="sm:hidden" />
            <LocaleToggle compactLabel className="hidden sm:inline-flex" showLabel />
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

        {!isHome && <MobileHeaderSearch />}

        <nav
          className={cn(
            "overflow-hidden border-t border-navy-100/80 bg-white transition-all duration-300 ease-smooth dark:border-navy-800 dark:bg-navy-950 lg:hidden",
            open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
          aria-label="Mobile menu"
        >
          <div className="space-y-1 px-3 py-3 sm:px-4">
            {!isHome && (
              <Link
                href="/search"
                prefetch
                className="flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-base font-semibold text-white shadow-sm"
                onClick={() => setOpen(false)}
              >
                {t("search")}
              </Link>
            )}
            {links
              .filter((l) => l.href !== "/search")
              .map((link) => (
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
