export default function AdminPanelLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="h-10 w-48 rounded-lg bg-navy-200/80 dark:bg-navy-800" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-navy-100 dark:bg-navy-800/80" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-navy-100 dark:bg-navy-800/60" />
        ))}
      </div>
    </div>
  );
}
