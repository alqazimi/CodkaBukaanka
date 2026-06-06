const HTML_TAG_PATTERN = /<[^>]*>/g;

const XSS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /data:application\/javascript/i,
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*meta\b[^>]*http-equiv/i,
  /<\s*link\b[^>]*rel\s*=\s*["']?import/i,
  /on\w+\s*=/i,
];

const PROMPT_INJECTION_PATTERN =
  /(ignore\s+(all|previous|prior)\s+instructions|system\s+prompt|developer\s+message|jailbreak|do\s+anything\s+now|act\s+as\s+an?\s+ai|reveal\s+hidden|bypass\s+(rules|security)|tool\s+call|function\s+call)/i;

export function normalizeUntrustedText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\u2028\u2029]/g, " ")
    .trim();
}

export function stripHtmlTags(value: string): string {
  return value.replace(HTML_TAG_PATTERN, "");
}

/** Strip markup and normalize before storing or displaying user-submitted text. */
export function sanitizeUntrustedText(value: string): string {
  return normalizeUntrustedText(stripHtmlTags(value));
}

export function looksLikePromptInjection(value: string): boolean {
  return PROMPT_INJECTION_PATTERN.test(value);
}

export function hasPromptInjectionPayload(values: string[]): boolean {
  return values.some((value) => looksLikePromptInjection(value));
}

export function hasXssPayload(values: string[]): boolean {
  return values.some((value) => XSS_PATTERNS.some((pattern) => pattern.test(value)));
}

export function rejectUntrustedPublicText(values: string[]): string | null {
  if (hasXssPayload(values)) return "Invalid content blocked";
  if (hasPromptInjectionPayload(values)) return "Suspicious content blocked";
  return null;
}
