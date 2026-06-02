import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard admin page padding and max width */
export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6 lg:p-8", className)}>{children}</div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminHero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-navy-200/70 bg-gradient-to-br from-white to-navy-50/40 p-5 shadow-soft sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card-surface p-4 sm:p-6", className)}>{children}</div>;
}

export function AdminTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-1 overflow-x-auto rounded-xl border border-navy-100 bg-white sm:mx-0", className)}>
      {children}
    </div>
  );
}

/** Stack action buttons on small screens */
export function AdminRowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-2 sm:justify-end", className)}>{children}</div>;
}

export function AdminListItem({
  title,
  meta,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-navy-100 p-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-navy-900">{title}</div>
        {meta && <div className="mt-1 text-sm text-navy-500">{meta}</div>}
      </div>
      {actions && <AdminRowActions>{actions}</AdminRowActions>}
    </div>
  );
}

export const adminInputClass =
  "w-full min-h-[44px] rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-base text-navy-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-sm";

export const adminBtnPrimary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50";

export const adminBtnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50";

export const adminBtnDanger =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-200 px-3.5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50";
