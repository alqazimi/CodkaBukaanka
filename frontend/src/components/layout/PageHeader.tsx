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
    <header className="mb-8 animate-fade-in border-b border-navy-100/80 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-base leading-relaxed text-navy-600">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
