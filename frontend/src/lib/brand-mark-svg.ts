/** Static shield mark SVG — shared by favicon routes, public logo, and schema. */
export const BRAND_MARK_VIEWBOX = "0 0 56 56";

export function buildBrandMarkSvg(gradientId = "brand-mark-gradient"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BRAND_MARK_VIEWBOX}" fill="none" role="img" aria-label="Codka Bukaanka">
  <defs>
    <linearGradient id="${gradientId}" x1="28" y1="6" x2="28" y2="50" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFC56E"/>
      <stop offset="0.45" stop-color="#FF8F6B"/>
      <stop offset="1" stop-color="#E94760"/>
    </linearGradient>
  </defs>
  <path d="M14 20 C14 20 20 11 28 11 C36 11 42 20 42 20" stroke="url(#${gradientId})" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M14 20 V32" stroke="url(#${gradientId})" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="14" cy="37" r="2.2" fill="url(#${gradientId})"/>
  <path d="M42 20 V32" stroke="url(#${gradientId})" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="42" cy="37" r="2.2" fill="url(#${gradientId})"/>
  <path d="M14 41 C14 41 20 47 28 47 C36 47 42 41 42 41" stroke="url(#${gradientId})" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M33 28 C33 22.5 29.5 18.5 24.5 18.5 C18.5 18.5 15 23 15 28.5 C15 34 18.5 38.5 24.5 38.5 C29 38.5 32 35.5 33 31" stroke="url(#${gradientId})" stroke-width="3.2" stroke-linecap="round"/>
</svg>`;
}

export function brandMarkDataUri(gradientId = "brand-mark-gradient"): string {
  return `data:image/svg+xml,${encodeURIComponent(buildBrandMarkSvg(gradientId))}`;
}
