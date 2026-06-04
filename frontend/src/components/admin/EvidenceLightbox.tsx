"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-md"
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
            aria-label="Previous image"
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
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
          {current.kind === "video" ? (
            <video src={current.url} controls autoPlay className="max-h-[75vh] w-full" />
          ) : (
            <img
              src={current.url}
              alt={current.title}
              className="mx-auto max-h-[min(75vh,900px)] w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        <div className="mt-4 rounded-xl bg-white/95 px-4 py-3 text-navy-900 dark:bg-navy-900/95 dark:text-navy-100">
          <p className="font-medium">{current.title}</p>
          {current.caption ? (
            <p className="mt-1 text-sm leading-relaxed text-navy-600 dark:text-navy-300">{current.caption}</p>
          ) : null}
          {slides.length > 1 && (
            <p className="mt-2 text-xs text-navy-500">
              {(index ?? 0) + 1} of {slides.length} · Use arrow keys to navigate
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
