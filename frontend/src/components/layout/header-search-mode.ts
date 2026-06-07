/** Pages that already have search UI or need a compact header on phones. */
const NO_HEADER_SEARCH_PATHS = ["/", "/search", "/submit-case", "/contact", "/corrections"] as const;

/**
 * Header search bar on inner pages only.
 * Home, search, and public forms use their own UI — no duplicate search row.
 */
export function shouldShowHeaderSearchBar(pathname: string) {
  return !NO_HEADER_SEARCH_PATHS.some(
    (path) => pathname === path || pathname.endsWith(path)
  );
}
