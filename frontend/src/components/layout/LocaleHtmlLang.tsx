"use client";

import { useEffect } from "react";

export function LocaleHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "so";
  }, [locale]);
  return null;
}
