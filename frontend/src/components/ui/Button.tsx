import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

const variants = {
  primary:
    "border border-[hsl(0_84%_55%/0.45)] bg-[linear-gradient(135deg,hsl(0_84%_55%),hsl(0_75%_42%))] text-white backdrop-blur-md hover:brightness-110 shadow-[0_8px_32px_-8px_hsl(0_84%_55%/0.25)] hover:shadow-[0_20px_60px_-20px_hsl(0_84%_55%/0.45)]",
  secondary:
    "border border-[hsl(0_0%_14%)] bg-[hsl(0_0%_11%)] text-[hsl(0_0%_96%)] backdrop-blur-md hover:border-[hsl(0_84%_55%/0.35)] hover:bg-[hsl(0_0%_13%)] shadow-sm",
  outline:
    "border border-[hsl(0_0%_14%)] bg-[hsl(0_0%_7%)] text-[hsl(0_0%_96%/0.9)] backdrop-blur-md hover:border-[hsl(0_84%_55%/0.35)] hover:bg-[hsl(0_0%_9%)]",
  ghost: "text-[hsl(0_0%_96%/0.85)] hover:bg-[hsl(0_0%_11%)] hover:text-white",
  danger: "border border-[hsl(0_84%_55%/0.5)] bg-[hsl(0_75%_42%)] text-white backdrop-blur-sm hover:brightness-110 shadow-sm",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  href?: string;
};

export function Button({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-[hsl(0_84%_55%/0.4)] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed",
    variants[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} prefetch className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
