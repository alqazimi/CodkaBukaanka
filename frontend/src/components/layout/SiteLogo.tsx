import { cn } from "@/lib/utils";
import { SEO_BRAND } from "@/lib/seo";
import { SiteLogoMark } from "@/components/layout/SiteLogoMark";

const sizeClasses = {
  sm: {
    root: "gap-2",
    word: "text-sm",
  },
  md: {
    root: "gap-2.5",
    word: "text-base sm:text-lg",
  },
  lg: {
    root: "gap-3",
    word: "text-lg sm:text-xl",
  },
} as const;

type SiteLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  showMark?: boolean;
};

/** Gabi School–style wordmark: gradient shield + split-color uppercase name. */
export function SiteLogo({ size = "md", className, showMark = true }: SiteLogoProps) {
  const styles = sizeClasses[size];

  return (
    <span className={cn("site-logo inline-flex items-center", styles.root, className)} aria-label={SEO_BRAND.nameCompact}>
      {showMark && <SiteLogoMark size={size} />}
      <span className={cn("site-logo__wordmark font-display font-bold uppercase tracking-[0.04em]", styles.word)}>
        <span className="site-logo__lead">CODKA</span>
        <span className="site-logo__accent">BUKAANKA</span>
      </span>
    </span>
  );
}
