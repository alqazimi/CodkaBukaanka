/** Headers that reduce phishing / Safe Browsing false positives and improve browser trust signals. */
export function attachTrustHeaders(response: Response, pathname: string): void {
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  }

  if (pathname.startsWith("/api/public")) {
    response.headers.set("Cache-Control", "no-store");
  }
}
