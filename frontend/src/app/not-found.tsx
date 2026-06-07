import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="glass-panel max-w-lg p-8 text-center">
        <h1 className="text-hero font-serif text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm font-medium text-muted">
          The page may have moved or does not exist. Please return to the archive home.
        </p>
        <Link
          href="/so"
          className="mt-6 inline-block rounded-xl border border-red-500/45 bg-red-600/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600/85"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
