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
    <header className="page-header mb-6 scroll-mt-[calc(var(--site-header-height,4rem)+0.75rem)] border-b border-white/20 pb-6 sm:mb-8 sm:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-hero font-serif text-2xl font-semibold tracking-tight text-pretty sm:text-3xl md:text-4xl">
            {title}
          </h1>
          <div className="page-header-accent" aria-hidden />
          {description && (
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </header>
  );
}
