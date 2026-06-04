"use client";

import { useMemo, useState } from "react";
import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import { EvidenceLightbox, type LightboxSlide } from "@/components/admin/EvidenceLightbox";
import { Eye, Maximize2 } from "lucide-react";

function BrokenMedia({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-navy-50 px-4 text-center dark:bg-navy-950">
      <p className="text-sm font-medium text-navy-700 dark:text-navy-300">Media could not be loaded</p>
      <p className="text-xs text-navy-500">{label}</p>
      {isSafeExternalUrl(url) ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal-700 underline dark:text-teal-400"
        >
          Open file directly
        </a>
      ) : null}
    </div>
  );
}

function EnlargeHint({ compact }: { compact?: boolean }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition group-hover:bg-navy-950/35">
      <span
        className={`flex items-center gap-2 rounded-full bg-white/95 font-semibold text-navy-900 opacity-0 shadow-lg transition group-hover:opacity-100 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        <Eye className={compact ? "h-4 w-4" : "h-5 w-5"} />
        Enlarge
      </span>
    </span>
  );
}

function EvidenceImage({
  item,
  onOpen,
  layout,
  featured,
}: {
  item: EvidenceItem;
  onOpen: () => void;
  layout: "grid" | "report";
  featured?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const label = item.fileName ?? item.description ?? "Evidence image";
  const caption = item.description?.trim() || null;
  const fileLabel = item.fileName;

  if (!isSafeExternalUrl(item.url) || failed) {
    return <BrokenMedia url={item.url} label={label} />;
  }

  if (layout === "report") {
    return (
      <figure
        className={`group overflow-hidden rounded-2xl border border-navy-100/90 bg-white shadow-soft dark:border-navy-800/90 dark:bg-navy-900/95 ${
          featured ? "lg:col-span-2" : ""
        }`}
      >
        <div
          className={
            featured
              ? "grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
              : "flex flex-col"
          }
        >
          <button
            type="button"
            onClick={onOpen}
            className="group relative block w-full bg-navy-50 dark:bg-navy-950"
            aria-label={`View ${label}`}
          >
            <img
              src={item.url}
              alt={label}
              className={`w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
                featured ? "aspect-[16/10] min-h-[220px] md:aspect-auto md:min-h-[320px] md:h-full" : "aspect-[4/3]"
              }`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
            />
            <EnlargeHint compact={!featured} />
          </button>
          <figcaption
            className={`flex flex-col justify-center border-navy-100 bg-gradient-to-br from-navy-50/60 to-white px-5 py-5 dark:border-navy-800 dark:from-navy-950/60 dark:to-navy-900/95 ${
              featured ? "border-t md:border-l md:border-t-0 md:px-6 md:py-8" : "border-t px-4 py-4"
            }`}
          >
            {fileLabel && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-teal-700 dark:text-teal-400">
                {fileLabel}
              </p>
            )}
            {caption ? (
              <p
                className={`leading-relaxed text-navy-800 dark:text-navy-200 ${
                  featured ? "mt-2 text-base sm:text-lg" : "mt-1.5 text-sm"
                }`}
              >
                {caption}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-navy-500 dark:text-navy-500">No caption provided</p>
            )}
            <button
              type="button"
              onClick={onOpen}
              className="mt-4 inline-flex w-fit items-center gap-2 text-xs font-semibold text-teal-700 transition hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              View full size
            </button>
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900/95">
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full bg-navy-50 dark:bg-navy-950"
        aria-label={`View ${label}`}
      >
        <img
          src={item.url}
          alt={label}
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.01]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
        <EnlargeHint compact />
      </button>
      {caption || fileLabel ? (
        <figcaption className="border-t border-navy-100 px-4 py-3 text-sm leading-relaxed text-navy-700 dark:border-navy-800 dark:text-navy-300">
          {caption ?? fileLabel}
        </figcaption>
      ) : null}
    </figure>
  );
}

function EvidenceVideo({
  item,
  onOpen,
  layout,
  featured,
}: {
  item: EvidenceItem;
  onOpen: () => void;
  layout: "grid" | "report";
  featured?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const caption = item.description?.trim() || null;
  const fileLabel = item.fileName;

  if (!isSafeExternalUrl(item.url) || failed) {
    return <BrokenMedia url={item.url} label={item.fileName ?? "Evidence video"} />;
  }

  if (layout === "report") {
    return (
      <figure
        className={`overflow-hidden rounded-2xl border border-navy-100/90 bg-white shadow-soft dark:border-navy-800/90 dark:bg-navy-900/95 ${
          featured ? "lg:col-span-2" : ""
        }`}
      >
        <div className={featured ? "grid gap-0 md:grid-cols-[1.15fr_0.85fr]" : "flex flex-col"}>
          <button type="button" onClick={onOpen} className="group relative block w-full bg-black" aria-label="Play video">
            <video
              src={item.url}
              className={`w-full object-cover ${featured ? "aspect-video md:min-h-[280px]" : "aspect-video"}`}
              muted
              preload="metadata"
              onError={() => setFailed(true)}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-navy-900">Play video</span>
            </span>
          </button>
          <figcaption
            className={`border-navy-100 bg-navy-50/50 px-5 py-5 dark:border-navy-800 dark:bg-navy-950/50 ${
              featured ? "border-t md:border-l md:border-t-0" : "border-t px-4 py-4"
            }`}
          >
            {fileLabel && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-teal-700 dark:text-teal-400">
                {fileLabel}
              </p>
            )}
            {caption ? (
              <p className="mt-2 text-sm leading-relaxed text-navy-700 dark:text-navy-300">{caption}</p>
            ) : null}
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900/95">
      <button type="button" onClick={onOpen} className="relative block w-full bg-black" aria-label="Play video">
        <video
          src={item.url}
          className="aspect-video w-full object-cover"
          muted
          preload="metadata"
          onError={() => setFailed(true)}
        />
      </button>
      {caption ? (
        <figcaption className="border-t border-navy-100 px-4 py-3 text-sm text-navy-700 dark:border-navy-800 dark:text-navy-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function MediaGallery({
  items,
  variant = "grid",
}: {
  items: EvidenceItem[];
  variant?: "grid" | "report";
}) {
  const visual = items.filter((e) => e.type === "IMAGE" || e.type === "VIDEO");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const layout: "grid" | "report" = variant === "report" ? "report" : "grid";

  const slides: LightboxSlide[] = useMemo(
    () =>
      visual
        .filter((i) => isSafeExternalUrl(i.url))
        .map((i) => ({
          url: i.url,
          title: i.fileName ?? i.type,
          caption: i.description ?? null,
          kind: i.type === "VIDEO" ? ("video" as const) : ("image" as const),
        })),
    [visual]
  );

  if (!visual.length) return null;

  function openAt(item: EvidenceItem) {
    const idx = slides.findIndex((s) => s.url === item.url);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }

  const gridClass =
    layout === "report"
      ? "mt-6 grid gap-6 lg:grid-cols-2"
      : "mt-4 grid gap-5 sm:grid-cols-2";

  return (
    <>
      <EvidenceLightbox
        slides={slides}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
      <div className={gridClass}>
        {visual.map((item, index) => {
          const featured = layout === "report" && index === 0;
          const props = { item, onOpen: () => openAt(item), layout, featured };
          return item.type === "IMAGE" ? (
            <EvidenceImage key={item.id} {...props} />
          ) : (
            <EvidenceVideo key={item.id} {...props} />
          );
        })}
      </div>
    </>
  );
}
