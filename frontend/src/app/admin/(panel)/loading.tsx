export default function AdminPanelLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="skeleton h-10 w-48" />
      <div className="skeleton mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    </div>
  );
}
