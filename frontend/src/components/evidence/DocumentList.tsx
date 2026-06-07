import type { EvidenceItem } from "@/types/entities";
import { getEvidenceOpenHref } from "@/lib/evidence-open";
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
          const openHref = getEvidenceOpenHref(item.url);
          const inner = (
            <>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-red-950/30 text-red-300">
                <FileText className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 block font-semibold text-white">
                  {item.fileName ?? "Document"}
                </span>
                {item.description && (
                  <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{item.description}</p>
                )}
              </span>
              {openHref ? (
                <Download className="h-5 w-5 shrink-0 text-red-400 opacity-0 transition group-hover:opacity-100" />
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {openHref ? (
                <a
                  href={openHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card-interactive flex items-center gap-4 p-4 hover:border-red-400/40"
                >
                  {inner}
                </a>
              ) : (
                <div className="admin-surface flex items-center gap-4 p-4 text-muted">
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
    <ul className="admin-surface-list mt-4">
      {items.map((item) => {
        const openHref = getEvidenceOpenHref(item.url);
        return (
          <li key={item.id}>
            {openHref ? (
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
              >
                <FileText className="h-5 w-5 shrink-0 text-red-400" />
                <span className="flex-1">
                  <span className="font-semibold text-white">{item.fileName ?? "Document"}</span>
                  {item.description && <p className="text-sm text-muted">{item.description}</p>}
                </span>
                <ExternalLink className="h-4 w-4 text-subtle" />
              </a>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 text-muted">
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
