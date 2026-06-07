export function EntityListSkeleton({
  count = 6,
  layout = "grid",
}: {
  count?: number;
  layout?: "grid" | "list";
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (layout === "list") {
    return (
      <div className="grid gap-3" aria-hidden>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton mt-3 h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {items.map((i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton mt-3 h-4 w-1/2" />
          <div className="skeleton mt-4 h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
