import type { ReactNode } from "react";

export const entityChipClass = "chip transition-colors hover:border-red-400/45 hover:bg-white/10";

export function EntityProfileHeader({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-white/20 pb-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
      {subtitle && (
        <div className="mt-2 text-base font-medium leading-relaxed text-white/75">{subtitle}</div>
      )}
      {meta && <p className="mt-4 text-sm font-semibold text-red-300">{meta}</p>}
      {children}
    </header>
  );
}
