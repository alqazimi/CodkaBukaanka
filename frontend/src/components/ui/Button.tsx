import { cn } from "@/lib/utils";

import { Link } from "@/i18n/routing";



const variants = {

  primary: "border border-red-500/45 bg-red-600/70 text-white backdrop-blur-md hover:border-red-400 hover:bg-red-600/85 shadow-[0_0_20px_rgb(220_38_38/0.3)] hover:shadow-[0_0_28px_rgb(220_38_38/0.4)]",

  secondary: "border border-white/10 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 shadow-sm",

  outline: "border border-white/10 bg-white/5 text-white backdrop-blur-md hover:border-red-400/45 hover:bg-white/10",

  ghost: "text-white/85 hover:bg-white/10",

  danger: "border border-red-400/50 bg-red-700/80 text-white backdrop-blur-sm hover:bg-red-700 shadow-sm",

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

    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed",

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

