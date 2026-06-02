/** Default public site locale (Somalia-first audience). */
export const DEFAULT_PUBLIC_LOCALE = "so" as const;

export function publicLocalePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${DEFAULT_PUBLIC_LOCALE}${normalized}`;
}
