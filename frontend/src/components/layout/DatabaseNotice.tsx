import { AlertTriangle } from "lucide-react";

export function DatabaseNotice() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Archive data is temporarily unavailable. Ensure the backend is running on port 4000 and
          PostgreSQL tables are created (<code className="rounded bg-amber-100 px-1">npm run db:migrate</code>{" "}
          in <code className="rounded bg-amber-100 px-1">backend/</code>).
        </p>
      </div>
    </div>
  );
}
