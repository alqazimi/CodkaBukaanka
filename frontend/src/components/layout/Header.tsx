"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    syncHeaderHeight(el);
    const observer = new ResizeObserver(() => syncHeaderHeight(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, showHeaderSearch, pathname]);

  function toggleMobileMenu() {
    if (headerRef.current) {
      syncHeaderHeight(headerRef.current);
    }
    setOpen((value) => !value);
  }

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

  const mobileNavLinkClass = (href: string) => {
    const active = isActive(pathname, href);
    return cn(
      "nav-link-mobile touch-manipulation",
      active && "nav-link-mobile-active",
      active && href === "/submit-case" && "nav-link-mobile-submit-active"
    );
  };

  const mobileMenu = open ? (
    <>
      <button
        type="button"
        className="mobile-menu-backdrop fixed inset-x-0 bottom-0 z-[5] bg-black/75 backdrop-blur-[2px] lg:hidden"
        style={{ top: "var(--site-header-height, 4rem)" }}
        onClick={() => setOpen(false)}
        aria-label={t("closeMenu")}
      />
      <nav
        id="mobile-main-nav"
        className="mobile-main-nav fixed inset-x-0 z-[8] max-h-[min(28rem,calc(100dvh-var(--site-header-height,4rem)))] overflow-y-auto overscroll-contain backdrop-blur-xl lg:hidden"
        style={{ top: "var(--site-header-height, 4rem)" }}
        aria-label="Mobile menu"
      >
        <div className="mobile-main-nav__inner px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={mobileNavLinkClass(link.href)}
              onClick={() => {
                setOpen(false);
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  ) : null;

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "site-header",
          scrolled && "site-header--scrolled",
          open && "site-header--menu-open"
        )}
      >
        <div className="mx-auto max-w-7xl">
          <div className="site-header-toolbar flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <Link href="/" className="group min-w-0 max-w-[46%] shrink sm:max-w-none">
              <SiteLogo size="sm" className="sm:hidden [&_.site-logo__wordmark]:hidden" />
              <SiteLogo size="md" className="hidden sm:inline-flex" />
            </Link>

            {showHeaderSearch && <DesktopHeaderSearch />}

            <div className="mobile-header-controls ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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

              <div className="flex items-center gap-2 lg:hidden">
                <LocaleToggle showLabel={false} className="sm:hidden" onNavigate={() => setOpen(false)} />
                <LocaleToggle
                  compactLabel
                  showLabel
                  className="hidden sm:inline-flex"
                  onNavigate={() => setOpen(false)}
                />
                <button
                  type="button"
                  className="mobile-menu-trigger"
                  onClick={toggleMobileMenu}
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
        </div>
        {mobileMenu}
      </header>
    </>
  );
}
