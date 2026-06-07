"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Thin top bar while a client route change is in flight. */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      setActive(false);
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        setActive(true);
      } catch {
        // ignore malformed href
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      className={cn("navigation-progress", active && "navigation-progress--active")}
      aria-hidden
    />
  );
}
