import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  value,
  label,
  icon: Icon,
  className,
}: {
  value: number;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("card-surface group p-5 text-center sm:p-6", className)}>
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 transition-transform duration-300 group-hover:-translate-y-0.5">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-navy-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-navy-500 sm:text-sm">{label}</p>
    </div>
  );
}
