"use client";

import Image from "next/image";
import { useState } from "react";
type MediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO" | "PDF" | "DOCUMENT";
  url: string;
  title?: string | null;
  caption?: string | null;
};

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const images = items.filter((m) => m.type === "IMAGE");
  const videos = items.filter((m) => m.type === "VIDEO");
  const [active, setActive] = useState(0);

  if (!images.length && !videos.length) return null;

  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-navy-100">
            <Image
              src={images[active]?.url ?? images[0].url}
              alt={images[active]?.caption ?? images[active]?.title ?? "Evidence"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === active ? "border-teal-600" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-xl bg-black">
              <video src={v.url} controls className="w-full" preload="metadata">
                <track kind="captions" />
              </video>
              {v.title && <p className="mt-2 text-sm text-navy-600">{v.title}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
