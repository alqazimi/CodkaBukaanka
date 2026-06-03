import type { EvidenceItem } from "@/types/entities";
import Image from "next/image";

export function MediaGallery({ items }: { items: EvidenceItem[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <figure
          key={item.id}
          className="overflow-hidden rounded-xl border border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900/95"
        >
          {item.type === "IMAGE" ? (
            <div className="relative aspect-video bg-navy-50 dark:bg-navy-950">
              <Image
                src={item.url}
                alt={item.description ?? item.fileName ?? "Evidence image"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <video src={item.url} controls className="aspect-video w-full bg-black" />
          )}
          {item.description && (
            <figcaption className="border-t border-navy-100 px-4 py-2 text-sm text-navy-600 dark:border-navy-800 dark:text-navy-300">
              {item.description}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
