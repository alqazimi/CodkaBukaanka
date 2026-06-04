"use client";

import { useState, type ReactNode } from "react";
import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import { evidenceImageUrl, evidenceOriginalUrl, EVIDENCE_FRAME } from "@/lib/evidence-display-url";
import { ExternalLink } from "lucide-react";

function BrokenMedia({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-2 bg-navy-50 px-4 text-center dark:bg-navy-950 sm:h-48">
      <p className="text-sm font-medium text-navy-700 dark:text-navy-300">Media could not be loaded</p>
      <p className="text-xs text-navy-500">{label}</p>
      {isSafeExternalUrl(url) ? (
        <a
          href={evidenceOriginalUrl(url)}
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
    <div
      className={`relative flex w-full shrink-0 items-center justify-center overflow-hidden bg-navy-100/80 dark:bg-navy-950 ${className}`}
    >
      {children}
    </div>
  );
}

function OpenOriginalLink({ url, label }: { url: string; label: string }) {
  if (!isSafeExternalUrl(url)) return null;
  return (
    <a
      href={evidenceOriginalUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-teal-700 transition hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function EvidenceImage({
  item,
  layout,
  featured,
  openLabel,
}: {
  item: EvidenceItem;
  layout: "grid" | "report";
  featured?: boolean;
  openLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  const label = item.fileName ?? item.description ?? "Evidence image";
  const caption = item.description?.trim() || null;
  const fileLabel = item.fileName;
  const previewSrc = evidenceImageUrl(item.url, featured ? "preview" : "thumb");

  if (!isSafeExternalUrl(item.url) || failed) {
    return <BrokenMedia url={item.url} label={label} />;
  }

  const frameClass = layout === "report"
    ? featured
      ? EVIDENCE_FRAME.reportFeatured
      : EVIDENCE_FRAME.reportCard
    : EVIDENCE_FRAME.gridCard;

  const imgClass =
    layout === "report"
      ? "max-h-full max-w-full object-contain"
      : "absolute inset-0 h-full w-full object-cover";

  const inner = (
    <MediaFrame className={frameClass}>
      <img
        src={previewSrc}
        alt={label}
        className={imgClass}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </MediaFrame>
  );

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
              ? "flex flex-col md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-stretch"
              : "flex flex-col"
          }
        >
          <div className="min-w-0 p-3 sm:p-4 md:p-0 md:pr-0">{inner}</div>
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
            <OpenOriginalLink url={item.url} label={openLabel} />
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900/95">
      {inner}
      {(caption || fileLabel) && (
        <figcaption className="border-t border-navy-100 px-4 py-3 dark:border-navy-800">
          <p className="text-sm leading-relaxed text-navy-700 dark:text-navy-300">{caption ?? fileLabel}</p>
          <OpenOriginalLink url={item.url} label={openLabel} />
        </figcaption>
      )}
    </figure>
  );
}

function EvidenceVideo({
  item,
  layout,
  featured,
  openLabel,
}: {
  item: EvidenceItem;
  layout: "grid" | "report";
  featured?: boolean;
  openLabel: string;
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

  const player = (
    <MediaFrame className={`${frameClass} bg-black`}>
      <video
        src={item.url}
        className="max-h-full max-w-full object-contain"
        controls
        preload="metadata"
        onError={() => setFailed(true)}
      />
    </MediaFrame>
  );

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
              ? "flex flex-col md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
              : "flex flex-col"
          }
        >
          <div className="min-w-0 p-3 sm:p-4 md:p-0">{player}</div>
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
            <OpenOriginalLink url={item.url} label={openLabel} />
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900/95">
      {player}
      {caption ? (
        <figcaption className="border-t border-navy-100 px-4 py-3 dark:border-navy-800">
          <p className="text-sm text-navy-700 dark:text-navy-300">{caption}</p>
          <OpenOriginalLink url={item.url} label={openLabel} />
        </figcaption>
      ) : null}
    </figure>
  );
}

export function MediaGallery({
  items,
  variant = "grid",
  openOriginalLabel = "Open full image",
}: {
  items: EvidenceItem[];
  variant?: "grid" | "report";
  openOriginalLabel?: string;
}) {
  const visual = items.filter((e) => e.type === "IMAGE" || e.type === "VIDEO");
  const layout: "grid" | "report" = variant === "report" ? "report" : "grid";

  if (!visual.length) return null;

  const gridClass =
    layout === "report" ? "mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2" : "mt-4 grid gap-5 sm:grid-cols-2";

  return (
    <div className={gridClass}>
      {visual.map((item, index) => {
        const featured = layout === "report" && index === 0;
        const props = { item, layout, featured, openLabel: openOriginalLabel };
        return item.type === "IMAGE" ? (
          <EvidenceImage key={item.id} {...props} />
        ) : (
          <EvidenceVideo key={item.id} {...props} openLabel="Open video" />
        );
      })}
    </div>
  );
}
