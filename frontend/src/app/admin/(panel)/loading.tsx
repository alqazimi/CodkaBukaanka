export default function AdminPanelLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="h-28 rounded-2xl bg-navy-100/80 dark:bg-navy-800/80" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-navy-100/70 dark:bg-navy-800/70" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-navy-100/70 dark:bg-navy-800/70" />
        <div className="h-64 rounded-xl bg-navy-100/70 dark:bg-navy-800/70" />
      </div>
    </div>
  );
}
