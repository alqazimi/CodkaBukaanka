import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["so", "en"],
  defaultLocale: "so",
  localePrefix: "always",
  /** Do not send visitors to /en from an old NEXT_LOCALE cookie; use /so until they tap English. */
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
