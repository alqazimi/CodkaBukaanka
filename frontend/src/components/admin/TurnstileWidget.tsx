"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  onToken,
  theme = "auto",
  resetKey = 0,
  loadErrorText,
  errorClassName = "mt-2 text-xs text-red-600 dark:text-red-400",
}: {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
  resetKey?: number;
  loadErrorText?: string;
  errorClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile)
  );
  const [loadError, setLoadError] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => onTokenRef.current(""),
    });
  }, [siteKey, theme]);

  useEffect(() => {
    if (scriptReady) renderWidget();
  }, [scriptReady, renderWidget, resetKey]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!siteKey) return null;

  return (
    <>
      <Script
        id="cf-turnstile-script"
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          setLoadError(false);
          setScriptReady(true);
        }}
        onError={() => {
          setLoadError(true);
          onTokenRef.current("");
        }}
      />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Security verification" />
      {loadError && (
        <p className={errorClassName} role="alert">
          {loadErrorText ??
            "Security check could not load. Disable ad blockers for this site or try another browser, then refresh."}
        </p>
      )}
    </>
  );
}

export function hasTurnstileSiteKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}
