import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function EntityCard({
  href,
  title,
  subtitle,
  meta,
  className,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  meta?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn("group card-interactive flex items-center justify-between p-5 sm:p-6", className)}
    >
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-lg font-bold tracking-tight text-white transition-colors group-hover:text-white">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm font-medium leading-relaxed text-white/60">{subtitle}</p>}
        {meta && (
          <p className="mt-3 inline-flex rounded-full border border-red-400/30 bg-red-950/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">
            {meta}
          </p>
        )}
      </div>
      <ChevronRight className="ml-3 h-5 w-5 shrink-0 text-white/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-red-300" />
    </Link>
  );
}
