/**
 * Header search bar on inner pages only.
 * Home and /search use their own full search UI — no duplicate nav link.
 */
export function shouldShowHeaderSearchBar(pathname: string) {
  return pathname !== "/" && pathname !== "/search";
}
