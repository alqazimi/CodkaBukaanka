"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

type ThemeToggleProps = {
  className?: string;
  variant?: "header" | "admin" | "ghost";
  switchToLightLabel?: string;
  switchToDarkLabel?: string;
};

export function ThemeToggle({
  className,
  variant = "header",
  switchToLightLabel = "Switch to day mode",
  switchToDarkLabel = "Switch to night mode",
}: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  const isDark = mounted && theme === "dark";
  const label = isDark ? switchToLightLabel : switchToDarkLabel;

  const variantClass =
    variant === "admin"
      ? "border-navy-700 bg-navy-800/90 text-amber-300 hover:bg-navy-700 hover:text-amber-200"
      : variant === "ghost"
        ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
        : "border-navy-200/90 bg-white text-navy-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-navy-600 dark:bg-navy-800 dark:text-amber-300 dark:hover:border-navy-500 dark:hover:bg-navy-700";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40",
        variantClass,
        className
      )}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-[1.125rem] w-[1.125rem]" aria-hidden /> : <Moon className="h-[1.125rem] w-[1.125rem]" aria-hidden />}
    </button>
  );
}
