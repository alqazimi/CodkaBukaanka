import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-white/20 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-hero font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <div className="page-header-accent" aria-hidden />
          {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
