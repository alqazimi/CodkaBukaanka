const PROMPT_INJECTION_PATTERN =
  /(ignore\s+(all|previous|prior)\s+instructions|system\s+prompt|developer\s+message|jailbreak|do\s+anything\s+now|act\s+as\s+an?\s+ai|reveal\s+hidden|bypass\s+(rules|security)|tool\s+call|function\s+call)/i;

export function normalizeUntrustedText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\u2028\u2029]/g, " ")
    .trim();
}

export function looksLikePromptInjection(value: string): boolean {
  return PROMPT_INJECTION_PATTERN.test(value);
}

export function hasPromptInjectionPayload(values: string[]): boolean {
  return values.some((value) => looksLikePromptInjection(value));
}
