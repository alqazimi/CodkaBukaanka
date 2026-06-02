/** Set only when the user taps the language (translate) button — not on auto-detect. */
export const USER_LOCALE_CHOICE_COOKIE = "USER_LOCALE_CHOICE";

const MAX_AGE = 60 * 60 * 24 * 365;

export function userChoseEnglish(cookieValue: string | undefined): boolean {
  return cookieValue === "en";
}

/** Remember explicit language choice (public site + admin link). */
export function setUserLocaleChoice(locale: "en" | "so") {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${USER_LOCALE_CHOICE_COOKIE}=${locale};path=/;max-age=${MAX_AGE};SameSite=Lax${secure}`;
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${MAX_AGE};SameSite=Lax${secure}`;
}

export function readUserLocaleChoice(): "en" | "so" {
  if (typeof document === "undefined") return "so";
  const match = document.cookie.match(new RegExp(`${USER_LOCALE_CHOICE_COOKIE}=(en|so)`));
  if (match?.[1] === "en") return "en";
  if (match?.[1] === "so") return "so";
  return "so";
}

/** /en/foo → /so/foo */
export function toSomaliPath(pathname: string): string {
  if (pathname === "/en") return "/so";
  if (pathname.startsWith("/en/")) return `/so${pathname.slice(3)}`;
  return pathname;
}
