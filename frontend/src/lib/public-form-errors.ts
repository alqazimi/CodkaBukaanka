/** Map backend English error strings to client translation keys. */
const ERROR_KEY_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /security check|security verification|complete the security/i, key: "captchaRequired" },
  { pattern: /too many requests|try again later/i, key: "rateLimited" },
  { pattern: /wait a moment before submitting/i, key: "waitBeforeSubmit" },
  { pattern: /upload size|too large|file type not allowed|too many files/i, key: "uploadError" },
  { pattern: /check all fields/i, key: "validationError" },
];

export function translatePublicFormError(
  apiError: string,
  t: (key: string) => string,
  fallbackKey = "error"
): string {
  const trimmed = apiError.trim();
  if (!trimmed) return t(fallbackKey);

  for (const { pattern, key } of ERROR_KEY_PATTERNS) {
    if (pattern.test(trimmed)) return t(key);
  }

  return trimmed;
}
