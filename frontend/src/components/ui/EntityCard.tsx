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
    <Link href={href} prefetch className={cn("group card-interactive flex items-center justify-between p-5 sm:p-6", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-navy-900 transition-colors group-hover:text-teal-800">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-navy-500">{subtitle}</p>}
        {meta && <p className="mt-3 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">{meta}</p>}
      </div>
      <ChevronRight className="ml-3 h-5 w-5 shrink-0 text-navy-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-teal-600" />
    </Link>
  );
}
