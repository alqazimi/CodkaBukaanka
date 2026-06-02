"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const switchLocale = locale === "en" ? "so" : "en";

  const links = [
    { href: "/", label: t("home") },
    { href: "/search", label: t("search") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/patients", label: t("patients") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/70 bg-white/80 backdrop-blur-xl dark:border-navy-800/70 dark:bg-navy-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex flex-col transition-opacity hover:opacity-95">
          <span className="font-serif text-lg font-semibold tracking-tight text-navy-900 dark:text-white sm:text-xl">CodkaBukaanka</span>
          <span className="text-[11px] uppercase tracking-[0.16em] text-navy-500 transition-colors group-hover:text-teal-700 dark:text-navy-400 dark:group-hover:text-teal-400">
            Investigative Documentation Archive
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={cn("nav-link py-1", isActive(pathname, link.href) && "nav-link-active")}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle
            switchToLightLabel={tTheme("switchToLight")}
            switchToDarkLabel={tTheme("switchToDark")}
          />
          <Link
            href={pathname}
            locale={switchLocale}
            className="flex items-center gap-1.5 rounded-full border border-navy-200/90 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-200 dark:hover:border-teal-600 dark:hover:bg-navy-700"
          >
            <Globe className="h-3.5 w-3.5" />
            {switchLocale.toUpperCase()}
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle
            switchToLightLabel={tTheme("switchToLight")}
            switchToDarkLabel={tTheme("switchToDark")}
          />
        <button
          type="button"
          className="rounded-xl border border-navy-200/80 bg-white p-2 text-navy-700 transition-colors hover:bg-navy-50 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>
      </div>

      <nav
        className={cn(
          "overflow-hidden border-t border-navy-100/80 bg-white transition-all duration-300 ease-smooth dark:border-navy-800 dark:bg-navy-950 lg:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, link.href)
                  ? "bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                  : "text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800"
              )}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={pathname}
            locale={switchLocale}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
            onClick={() => setOpen(false)}
          >
            <Globe className="h-4 w-4" />
            {switchLocale === "en" ? "English" : "Soomaali"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
