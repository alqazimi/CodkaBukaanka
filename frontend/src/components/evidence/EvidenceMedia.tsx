"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";

function MediaFrame({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption?: string | null;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900/95">
      {children}
      {caption ? (
        <figcaption className="border-t border-navy-100 px-4 py-2 text-sm text-navy-600 dark:border-navy-800 dark:text-navy-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function BrokenMedia({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-navy-50 px-4 text-center dark:bg-navy-950">
      <p className="text-sm font-medium text-navy-700 dark:text-navy-300">Image could not be loaded</p>
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

function EvidenceImage({ item }: { item: EvidenceItem }) {
  const [failed, setFailed] = useState(false);
  const label = item.fileName ?? item.description ?? "Evidence image";
  const caption = item.description ?? item.fileName;

  if (!isSafeExternalUrl(item.url) || failed) {
    return (
      <MediaFrame caption={caption}>
        <BrokenMedia url={item.url} label={label} />
      </MediaFrame>
    );
  }

  return (
    <MediaFrame caption={caption}>
      <div className="relative aspect-video bg-navy-50 dark:bg-navy-950">
        {/* Native img — works for Cloudinary and Railway/local API URLs (next/image only allows configured hosts). */}
        <img
          src={item.url}
          alt={label}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </div>
    </MediaFrame>
  );
}

function EvidenceVideo({ item }: { item: EvidenceItem }) {
  const [failed, setFailed] = useState(false);
  const caption = item.description ?? item.fileName;

  if (!isSafeExternalUrl(item.url) || failed) {
    return (
      <MediaFrame caption={caption}>
        <BrokenMedia url={item.url} label={item.fileName ?? "Evidence video"} />
      </MediaFrame>
    );
  }

  return (
    <MediaFrame caption={caption}>
      <video
        src={item.url}
        controls
        className="aspect-video w-full bg-black"
        preload="metadata"
        onError={() => setFailed(true)}
      />
    </MediaFrame>
  );
}

export function EvidenceMedia({ item }: { item: EvidenceItem }) {
  if (item.type === "IMAGE") return <EvidenceImage item={item} />;
  if (item.type === "VIDEO") return <EvidenceVideo item={item} />;
  return null;
}

export function MediaGallery({ items }: { items: EvidenceItem[] }) {
  const visual = items.filter((e) => e.type === "IMAGE" || e.type === "VIDEO");
  if (!visual.length) return null;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {visual.map((item) => (
        <EvidenceMedia key={item.id} item={item} />
      ))}
    </div>
  );
}
