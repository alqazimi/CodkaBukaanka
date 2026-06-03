import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

const variants = {
  primary: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-sm hover:shadow-md",
  secondary: "bg-navy-900 text-white hover:bg-navy-950 shadow-sm",
  outline:
    "border border-navy-200 bg-white text-navy-800 hover:border-teal-300 hover:bg-teal-50 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100 dark:hover:border-teal-600 dark:hover:bg-navy-800",
  ghost: "text-navy-700 hover:bg-navy-100 dark:text-navy-200 dark:hover:bg-navy-800",
  danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm",
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
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
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
