/** Escape `<` so JSON-LD cannot break out of a script element via `</script>`. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
