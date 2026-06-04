import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import { FileText, ExternalLink, Download } from "lucide-react";

export function DocumentList({
  items,
  variant = "default",
}: {
  items: EvidenceItem[];
  variant?: "default" | "report";
}) {
  if (!items.length) return null;

  if (variant === "report") {
    return (
      <ul className="mt-6 space-y-3">
        {items.map((item, i) => {
          const safeUrl = isSafeExternalUrl(item.url);
          const inner = (
            <>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                <FileText className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-navy-500 dark:text-navy-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 block font-medium text-navy-900 dark:text-navy-100">
                  {item.fileName ?? "Document"}
                </span>
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed text-navy-600 dark:text-navy-400">{item.description}</p>
                )}
              </span>
              {safeUrl ? (
                <Download className="h-5 w-5 shrink-0 text-teal-600 opacity-0 transition group-hover:opacity-100 dark:text-teal-400" />
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {safeUrl ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-navy-100/90 bg-white p-4 shadow-sm transition hover:border-teal-200/80 hover:shadow-md dark:border-navy-800 dark:bg-navy-900/95 dark:hover:border-teal-800/60"
                >
                  {inner}
                </a>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-navy-50/80 p-4 text-navy-500 dark:border-navy-800 dark:bg-navy-950/50">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white dark:divide-navy-800 dark:border-navy-800 dark:bg-navy-900/95">
      {items.map((item) => {
        const safeUrl = isSafeExternalUrl(item.url);
        return (
          <li key={item.id}>
            {safeUrl ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-navy-50 dark:hover:bg-navy-800/80"
              >
                <FileText className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="flex-1">
                  <span className="font-medium text-navy-900 dark:text-navy-100">{item.fileName ?? "Document"}</span>
                  {item.description && (
                    <p className="text-sm text-navy-500 dark:text-navy-400">{item.description}</p>
                  )}
                </span>
                <ExternalLink className="h-4 w-4 text-navy-400 dark:text-navy-500" />
              </a>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 text-navy-500 dark:text-navy-400">
                <FileText className="h-5 w-5 shrink-0" />
                <span>{item.fileName ?? "Document"} (link unavailable)</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
