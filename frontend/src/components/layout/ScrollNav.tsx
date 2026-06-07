"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SCROLL_EDGE = 120;
const SHOW_UP_AFTER = 320;

export function ScrollNav() {
  const t = useTranslations("scroll");
  const [scrollY, setScrollY] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const update = useCallback(() => {
    const y = window.scrollY;
    const { innerHeight } = window;
    const docHeight = document.documentElement.scrollHeight;
    const scrollable = docHeight > innerHeight + 80;

    setScrollY(y);
    setCanScroll(scrollable);
    setAtTop(y < SCROLL_EDGE);
    setAtBottom(y + innerHeight >= docHeight - SCROLL_EDGE);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const showUp = !atTop && scrollY > SHOW_UP_AFTER;
  const showDown = !atBottom;
  const visible = canScroll && (showUp || showDown);

  if (!visible) return null;

  return (
    <nav
      className={cn("scroll-nav-dock scroll-nav-dock--visible")}
      aria-label={t("label")}
    >
      <div className="scroll-nav-dock__inner">
        {showUp && (
          <button
            type="button"
            onClick={scrollToTop}
            className="scroll-nav-dock__btn"
            aria-label={t("scrollUp")}
            title={t("scrollUp")}
          >
            <ArrowUp className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} aria-hidden />
          </button>
        )}
        {showUp && showDown && <div className="scroll-nav-dock__divider" aria-hidden />}
        {showDown && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="scroll-nav-dock__btn"
            aria-label={t("scrollDown")}
            title={t("scrollDown")}
          >
            <ArrowDown className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>
    </nav>
  );
}
