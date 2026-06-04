import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function AdminApiErrorBanner({ message }: { message: string }) {
  const mfaRequired =
    message.includes("MFA setup") ||
    message.includes("Authenticator") ||
    message.includes("mfa_setup");

  return (
    <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Could not load admin data</p>
        <p className="mt-1">{message}</p>
        {mfaRequired ? (
          <Link
            href="/admin/security?setup=1"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
          >
            Open Security setup
          </Link>
        ) : null}
      </div>
    </div>
  );
}
