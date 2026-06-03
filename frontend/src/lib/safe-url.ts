export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production") return parsed.protocol === "https:";
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
