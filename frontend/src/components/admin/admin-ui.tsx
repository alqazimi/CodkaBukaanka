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
        <h1 className="section-title text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="section-subtitle mt-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminHero({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass-panel p-5 sm:p-6", className)}>{children}</div>;
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card-surface p-4 sm:p-6", className)}>{children}</div>;
}

export function AdminTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("admin-surface-list -mx-1 overflow-x-auto sm:mx-0", className)}>{children}</div>;
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
    <div className="flex flex-col gap-3 border-b border-white/10 p-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-white">{title}</div>
        {meta && <div className="mt-1 text-sm text-muted">{meta}</div>}
      </div>
      {actions && <AdminRowActions>{actions}</AdminRowActions>}
    </div>
  );
}

export const adminInputClass = "input-base min-h-[44px] text-base sm:text-sm";

export const adminBtnPrimary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/45 bg-red-600/70 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-red-400 hover:bg-red-600/85 disabled:opacity-50";

export const adminBtnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-red-400/45 hover:bg-white/10 disabled:opacity-50";

export const adminBtnDanger =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-400/50 bg-red-700/80 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-red-700 disabled:opacity-50";

export const adminHeading = "font-bold text-white";
export const adminSubheading = "text-lg font-bold text-white";
export const adminText = "text-sm font-medium text-white/85";
export const adminTextMuted = "text-xs text-subtle";

/** Filter/tab pill — active state */
export const adminTabActive = "border-red-400/50 bg-red-950/40 text-red-200";
/** Filter/tab pill — inactive state */
export const adminTabInactive = "border-white/10 text-muted hover:bg-white/5";
/** Status filter — selected */
export const adminFilterActive = "border-red-400/50 bg-red-600/70 text-white";
