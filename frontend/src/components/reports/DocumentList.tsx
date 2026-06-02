import { FileText, Download } from "lucide-react";

type Doc = {
  id: string;
  title: string;
  titleSo?: string | null;
  url: string;
  mimeType?: string | null;
};

export function DocumentList({ documents, locale }: { documents: Doc[]; locale: string }) {
  if (!documents.length) return null;

  return (
    <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100">
      {documents.map((doc) => {
        const title = locale === "so" && doc.titleSo ? doc.titleSo : doc.title;
        const isPdf = doc.mimeType?.includes("pdf") || doc.url.endsWith(".pdf");
        return (
          <li key={doc.id}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-navy-50"
            >
              <FileText className="h-5 w-5 shrink-0 text-teal-600" />
              <span className="flex-1 text-sm font-medium text-navy-800">{title}</span>
              <span className="flex items-center gap-1 text-xs text-teal-700">
                {isPdf ? "PDF" : "File"}
                <Download className="h-4 w-4" />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
