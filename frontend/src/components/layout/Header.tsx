"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopHeaderSearch, MobileHeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { shouldShowHeaderSearchBar } from "@/components/layout/header-search-mode";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function syncHeaderHeight(el: HTMLElement | null) {
  if (!el) return;
  document.documentElement.style.setProperty("--site-header-height", `${el.offsetHeight}px`);
}

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const showHeaderSearch = shouldShowHeaderSearchBar(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const links = [
    { href: "/", label: t("home") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/patients", label: t("patients") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    syncHeaderHeight(el);
    const observer = new ResizeObserver(() => syncHeaderHeight(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, showHeaderSearch, pathname]);

  const navLinkClass = (href: string) =>
    cn(
      "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors nav-link",
      isActive(pathname, href) && "nav-link-active"
    );

  return (
    <header
      ref={headerRef}
      className={cn("site-header", scrolled && "site-header--scrolled")}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" className="group shrink-0">
            <SiteLogo className="transition-transform duration-200 group-hover:scale-[1.02]" />
          </Link>

          {showHeaderSearch && <DesktopHeaderSearch />}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="hidden items-center gap-1 lg:flex xl:gap-1.5" aria-label="Main">
              {links.map((link) => (
                <Link key={link.href} href={link.href} prefetch className={navLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
              <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
                <LocaleToggle compactLabel showLabel />
              </div>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <LocaleToggle showLabel={false} className="sm:hidden" />
              <LocaleToggle compactLabel showLabel className="hidden sm:inline-flex" />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(0_0%_14%)] bg-[hsl(0_0%_8%)] text-white/90 backdrop-blur-md transition-colors hover:border-[hsl(0_84%_55%/0.35)] hover:bg-[hsl(0_0%_11%)] hover:text-white"
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
            "overflow-hidden border-t border-[hsl(0_0%_14%)] bg-[hsl(0_0%_5%/0.95)] backdrop-blur-xl transition-all duration-300 ease-smooth lg:hidden",
            open
              ? "pointer-events-auto visible max-h-[28rem] opacity-100"
              : "pointer-events-none invisible max-h-0 opacity-0 border-t-0"
          )}
          aria-label="Mobile menu"
          aria-hidden={!open}
        >
          <div className="space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  "nav-link nav-link-mobile block min-h-[44px] rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium",
                  isActive(pathname, link.href) && "nav-link-active nav-link-mobile-active font-semibold"
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
