import { AlertTriangle } from "lucide-react";

export function DatabaseNotice() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Some archive content is temporarily unavailable. Please refresh the page or try again in a
          few minutes.
        </p>
      </div>
    </div>
  );
}
