import type { EvidenceItem } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import { FileText, ExternalLink } from "lucide-react";

export function DocumentList({ items }: { items: EvidenceItem[] }) {
  if (!items.length) return null;

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
