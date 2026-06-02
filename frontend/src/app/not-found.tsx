import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-4">
      <div className="max-w-lg rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-navy-900">Page not found</h1>
        <p className="mt-3 text-sm text-navy-600">
          The page may have moved or does not exist. Please return to the archive home.
        </p>
        <Link href="/en" className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Back to home
        </Link>
      </div>
    </div>
  );
}
