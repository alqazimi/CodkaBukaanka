"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { getEvidenceOpenHref } from "@/lib/evidence-open";
import { evidenceImageDisplaySrc, evidenceStreamDisplaySrc } from "@/lib/evidence-view-url";

export type LightboxSlide = {
  url: string;
  title: string;
  caption?: string | null;
  kind?: "image" | "video";
};

export function EvidenceLightbox({
  slides,
  index,
  onClose,
  onIndexChange,
}: {
  slides: LightboxSlide[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const open = index !== null && slides.length > 0;
  const current = open && index !== null ? slides[index] : null;
  const displayUrl = current
    ? current.kind === "video"
      ? evidenceStreamDisplaySrc(current.url)
      : evidenceImageDisplaySrc(current.url, "preview")
    : "";
  const openHref = current ? getEvidenceOpenHref(current.url) : null;

  const goPrev = useCallback(() => {
    if (index === null || slides.length < 2) return;
    onIndexChange((index - 1 + slides.length) % slides.length);
  }, [index, slides.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null || slides.length < 2) return;
    onIndexChange((index + 1) % slides.length);
  }, [index, slides.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goPrev, goNext]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/92 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-navy-900/80 ring-1 ring-white/10">
          {current.kind === "video" ? (
            <video
              src={displayUrl}
              controls
              autoPlay
              className="max-h-[min(78vh,820px)] w-full max-w-full"
            />
          ) : (
            <img
              src={displayUrl}
              alt={current.title}
              className="block max-h-[min(78vh,820px)] w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="mt-4 shrink-0 rounded-xl bg-white px-4 py-3 text-navy-900 shadow-lg dark:bg-navy-900 dark:text-navy-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{current.title}</p>
              {current.caption ? (
                <p className="mt-1 text-sm leading-relaxed text-navy-600 dark:text-navy-300">{current.caption}</p>
              ) : null}
              {slides.length > 1 && (
                <p className="mt-2 text-xs text-navy-500">
                  {(index ?? 0) + 1} of {slides.length}
                </p>
              )}
            </div>
            {openHref ? (
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-navy-50 dark:border-navy-700 dark:text-teal-400 dark:hover:bg-navy-800"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
