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

type NavLink = {
  href: string;
  label: string;
  highlight?: boolean;
};

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const showHeaderSearch = shouldShowHeaderSearchBar(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const links: NavLink[] = [
    { href: "/", label: t("home") },
    { href: "/search", label: t("searchShort") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/patients", label: t("patients") },
    { href: "/submit-case", label: t("submitCase"), highlight: true },
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

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const navLinkClass = (href: string, highlight?: boolean) =>
    cn(
      "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors nav-link",
      highlight && "nav-link-highlight",
      isActive(pathname, href) && "nav-link-active"
    );

  const mobileNavLinkClass = (href: string, highlight?: boolean) =>
    cn(
      "nav-link nav-link-mobile block min-h-[48px] rounded-lg border border-transparent px-3 py-3 text-base font-medium touch-manipulation",
      highlight && "nav-link-mobile-highlight",
      isActive(pathname, href) && "nav-link-active nav-link-mobile-active font-semibold"
    );

  return (
    <header
      ref={headerRef}
      className={cn("site-header", scrolled && "site-header--scrolled")}
    >
      <div className="mx-auto max-w-7xl">
        <div className="site-header-toolbar relative z-[60] flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" className="group min-w-0 max-w-[46%] shrink sm:max-w-none">
            <SiteLogo
              size="sm"
              className="sm:hidden [&_.site-logo__wordmark]:hidden"
            />
            <SiteLogo size="md" className="hidden sm:inline-flex" />
          </Link>

          {showHeaderSearch && <DesktopHeaderSearch />}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1" aria-label="Main">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  className={navLinkClass(link.href, link.highlight)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
                <LocaleToggle compactLabel showLabel />
              </div>
            </nav>

            <div className="relative z-[61] flex items-center gap-2 lg:hidden">
              <LocaleToggle showLabel={false} className="sm:hidden" onNavigate={() => setOpen(false)} />
              <LocaleToggle
                compactLabel
                showLabel
                className="hidden sm:inline-flex"
                onNavigate={() => setOpen(false)}
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-[hsl(0_0%_14%)] bg-[hsl(0_0%_8%)] text-white/90 backdrop-blur-md transition-colors hover:border-[hsl(0_84%_55%/0.35)] hover:bg-[hsl(0_0%_11%)] hover:text-white active:scale-[0.98]"
                onClick={() => setOpen((value) => !value)}
                aria-label={open ? t("closeMenu") : t("openMenu")}
                aria-expanded={open}
                aria-controls="mobile-main-nav"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {showHeaderSearch && <MobileHeaderSearch />}

        {open && (
          <button
            type="button"
            className="fixed inset-0 z-[54] bg-black/75 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
          />
        )}

        <nav
          id="mobile-main-nav"
          className={cn(
            "fixed inset-x-0 z-[55] overflow-y-auto overscroll-contain border-b border-[hsl(0_0%_14%)] bg-[hsl(0_0%_4%/0.98)] shadow-2xl backdrop-blur-xl transition-[transform,opacity,visibility] duration-300 ease-smooth lg:hidden",
            open
              ? "visible max-h-[min(28rem,calc(100dvh-var(--site-header-height,4rem)))] translate-y-0 opacity-100"
              : "invisible max-h-0 -translate-y-2 opacity-0 pointer-events-none"
          )}
          style={{ top: "var(--site-header-height, 4rem)" }}
          aria-label="Mobile menu"
          aria-hidden={!open}
        >
          <div className="space-y-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={mobileNavLinkClass(link.href, link.highlight)}
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
