"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import { evidenceImageUrl, EVIDENCE_FRAME } from "@/lib/evidence-display-url";
import { EvidenceLightbox, type LightboxSlide } from "@/components/admin/EvidenceLightbox";
import { Eye, Maximize2 } from "lucide-react";

function BrokenMedia({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-2 bg-navy-50 px-4 text-center dark:bg-navy-950 sm:h-48">
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

function MediaFrame({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div className={`relative w-full shrink-0 overflow-hidden bg-navy-50 dark:bg-navy-950 ${className}`}>
      {children}
    </div>
  );
}

function EnlargeHint({ compact }: { compact?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy-950/0 transition group-hover:bg-navy-950/35">
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
  const previewSrc = evidenceImageUrl(item.url, featured ? "preview" : "thumb");

  if (!isSafeExternalUrl(item.url) || failed) {
    return <BrokenMedia url={item.url} label={label} />;
  }

  if (layout === "report") {
    const frameClass = featured ? EVIDENCE_FRAME.reportFeatured : EVIDENCE_FRAME.reportCard;
    return (
      <figure
        className={`overflow-hidden rounded-2xl border border-navy-100/90 bg-white shadow-soft dark:border-navy-800/90 dark:bg-navy-900/95 ${
          featured ? "lg:col-span-2" : ""
        }`}
      >
        <div
          className={
            featured
              ? "flex flex-col md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-stretch"
              : "flex flex-col"
          }
        >
          <button
            type="button"
            onClick={onOpen}
            className="group relative block w-full min-w-0 text-left"
            aria-label={`View ${label}`}
          >
            <MediaFrame className={frameClass}>
              <img
                src={previewSrc}
                alt={label}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
              />
              <EnlargeHint compact={!featured} />
            </MediaFrame>
          </button>
          <figcaption
            className={`flex min-w-0 flex-col justify-center border-navy-100 bg-gradient-to-br from-navy-50/60 to-white dark:border-navy-800 dark:from-navy-950/60 dark:to-navy-900/95 ${
              featured ? "border-t px-5 py-5 md:border-l md:border-t-0 md:px-6 md:py-6" : "border-t px-4 py-4"
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
                  featured ? "mt-2 text-sm sm:text-base" : "mt-1.5 text-sm"
                }`}
              >
                {caption}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-navy-500">No caption provided</p>
            )}
            <button
              type="button"
              onClick={onOpen}
              className="mt-3 inline-flex w-fit items-center gap-2 text-xs font-semibold text-teal-700 transition hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
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
        className="group relative block w-full"
        aria-label={`View ${label}`}
      >
        <MediaFrame className={EVIDENCE_FRAME.gridCard}>
          <img
            src={previewSrc}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
          <EnlargeHint compact />
        </MediaFrame>
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
  const frameClass =
    layout === "report"
      ? featured
        ? EVIDENCE_FRAME.reportFeatured
        : EVIDENCE_FRAME.reportCard
      : EVIDENCE_FRAME.gridCard;

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
        <div
          className={
            featured
              ? "flex flex-col md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
              : "flex flex-col"
          }
        >
          <button type="button" onClick={onOpen} className="group relative block w-full" aria-label="Play video">
            <MediaFrame className={`${frameClass} bg-black`}>
              <video
                src={item.url}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                preload="metadata"
                onError={() => setFailed(true)}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-navy-900">
                  Play video
                </span>
              </span>
            </MediaFrame>
          </button>
          <figcaption
            className={`border-navy-100 bg-navy-50/50 dark:border-navy-800 dark:bg-navy-950/50 ${
              featured ? "border-t px-5 py-5 md:border-l md:border-t-0" : "border-t px-4 py-4"
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
      <button type="button" onClick={onOpen} className="relative block w-full" aria-label="Play video">
        <MediaFrame className={`${frameClass} bg-black`}>
          <video
            src={item.url}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            preload="metadata"
            onError={() => setFailed(true)}
          />
        </MediaFrame>
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
          url: i.type === "IMAGE" ? evidenceImageUrl(i.url, "full") : i.url,
          title: i.fileName ?? i.type,
          caption: i.description ?? null,
          kind: i.type === "VIDEO" ? ("video" as const) : ("image" as const),
        })),
    [visual]
  );

  if (!visual.length) return null;

  function openAt(item: EvidenceItem) {
    const idx = visual.findIndex((v) => v.id === item.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }

  const gridClass =
    layout === "report" ? "mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2" : "mt-4 grid gap-5 sm:grid-cols-2";

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
