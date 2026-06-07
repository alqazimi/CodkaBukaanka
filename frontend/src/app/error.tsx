"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-3 text-sm font-medium text-muted">
        {process.env.NODE_ENV === "development" ? error.message : "Please try again or return home."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-red-500/45 bg-red-600/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600/85"
        >
          Try again
        </button>
        <Link
          href="/so"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 hover:text-white"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
