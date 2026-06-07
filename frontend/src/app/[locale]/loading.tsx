export default function LocaleLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-full max-w-3xl" />
        <div className="skeleton h-4 w-full max-w-2xl" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-lg"
          >
            <div className="skeleton h-5 w-2/3" />
            <div className="mt-4 space-y-2.5">
              <div className="skeleton h-3.5 w-full" />
              <div className="skeleton h-3.5 w-5/6" />
              <div className="skeleton h-3.5 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
