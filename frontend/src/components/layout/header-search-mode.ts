/** Pages that already have dedicated search UI — skip the duplicate header bar. */
const NO_HEADER_SEARCH_PATHS = ["/", "/search", "/submit-case", "/contact", "/corrections"] as const;

/**
 * Header search on inner pages. Home and form pages use their own search UI.
 * Search is not a menu item; use the header bar or home search instead.
 */
export function shouldShowHeaderSearchBar(pathname: string) {
  return !NO_HEADER_SEARCH_PATHS.some(
    (path) => pathname === path || pathname.endsWith(path)
  );
}
