"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

const markSizes = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-10 w-10",
} as const;

type SiteLogoMarkProps = {
  size?: keyof typeof markSizes;
  className?: string;
};

/** Shield + letter mark inspired by Gabi School's segmented gradient icon. */
export function SiteLogoMark({ size = "md", className }: SiteLogoMarkProps) {
  const gradientId = useId().replace(/:/g, "");
  const gradientRef = `url(#${gradientId})`;

  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("site-logo__mark shrink-0", markSizes[size], className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="28" y1="6" x2="28" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC56E" />
          <stop offset="0.45" stopColor="#FF8F6B" />
          <stop offset="1" stopColor="#E94760" />
        </linearGradient>
      </defs>

      <path
        d="M14 20 C14 20 20 11 28 11 C36 11 42 20 42 20"
        stroke={gradientRef}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M14 20 V32" stroke={gradientRef} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="14" cy="37" r="2.2" fill={gradientRef} />
      <path d="M42 20 V32" stroke={gradientRef} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="42" cy="37" r="2.2" fill={gradientRef} />
      <path
        d="M14 41 C14 41 20 47 28 47 C36 47 42 41 42 41"
        stroke={gradientRef}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M33 28 C33 22.5 29.5 18.5 24.5 18.5 C18.5 18.5 15 23 15 28.5 C15 34 18.5 38.5 24.5 38.5 C29 38.5 32 35.5 33 31"
        stroke={gradientRef}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
