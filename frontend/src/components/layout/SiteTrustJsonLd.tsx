import { FACEBOOK_URL } from "@/lib/contact";
import { getSiteUrl } from "@/lib/env";

/** Organization schema helps search engines and browsers identify this as a legitimate public archive. */
export function SiteTrustJsonLd() {
  const siteUrl = getSiteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CodkaBukaanka",
    alternateName: ["Diiwaanka Bukaanka", "Patient Registry Archive"],
    url: siteUrl,
    description:
      "Verified public documentation archive for medication errors, misdiagnosis, and patient safety incidents in Somalia.",
    sameAs: [FACEBOOK_URL],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
      availableLanguage: ["Somali", "English"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
