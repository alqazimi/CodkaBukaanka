"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-navy-50">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-navy-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-navy-600">
              An unexpected error occurred while loading this page.
            </p>
            <p className="mt-2 text-xs text-navy-400">{error.digest ? `Error ID: ${error.digest}` : ""}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={reset} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                Try again
              </button>
              <Link href="/en" className="rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50">
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
