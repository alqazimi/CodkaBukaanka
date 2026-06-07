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
    <html lang="so" className="dark bg-[#0a0a0a]">
      <body className="min-h-screen bg-[#0a0a0a] font-sans text-white antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="glass-panel max-w-lg p-8 text-center">
            <h1 className="font-serif text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mt-3 text-sm font-medium text-muted">
              An unexpected error occurred while loading this page.
            </p>
            <p className="mt-2 text-xs text-subtle">{error.digest ? `Error ID: ${error.digest}` : ""}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-xl border border-red-500/45 bg-red-600/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600/85"
              >
                Try again
              </button>
              <Link
                href="/so"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
