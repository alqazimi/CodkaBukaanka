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
    <div className={cn("card-surface group p-5 text-center transition-shadow duration-300 hover:shadow-[0_0_24px_rgb(180_0_0/0.15)] sm:p-6", className)}>
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-white/5 text-red-200 shadow-[0_0_12px_rgb(220_38_38/0.15)] backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-red-400/50 group-hover:shadow-[0_0_18px_rgb(220_38_38/0.3)]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="bg-gradient-to-b from-white to-red-100/80 bg-clip-text text-3xl font-semibold tabular-nums tracking-tight text-transparent">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-white/65 sm:text-sm">{label}</p>
    </div>
  );
}
