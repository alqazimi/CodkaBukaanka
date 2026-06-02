import type { EvidenceItem } from "@/types/entities";
import { FileText, ExternalLink } from "lucide-react";

export function DocumentList({ items }: { items: EvidenceItem[] }) {
  if (!items.length) return null;

  return (
    <ul className="mt-4 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-navy-50"
          >
            <FileText className="h-5 w-5 shrink-0 text-teal-600" />
            <span className="flex-1">
              <span className="font-medium text-navy-900">{item.fileName ?? "Document"}</span>
              {item.description && <p className="text-sm text-navy-500">{item.description}</p>}
            </span>
            <ExternalLink className="h-4 w-4 text-navy-400" />
          </a>
        </li>
      ))}
    </ul>
  );
}
