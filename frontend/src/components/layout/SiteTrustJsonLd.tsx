import { LEGAL_ENTITY } from "@/content/legal/entity";
import { FACEBOOK_URL } from "@/lib/contact";
import { absoluteSiteUrl, SEO_BRAND } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

/** Organization + Website schema strengthens brand entity recognition in Google. */
export function SiteTrustJsonLd() {
  const siteUrl = absoluteSiteUrl();
  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SEO_BRAND.nameCompact,
      legalName: SEO_BRAND.nameSpaced,
      alternateName: SEO_BRAND.alternateNames,
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
      description: SEO_BRAND.defaultDescription,
      identifier: {
        "@type": "PropertyValue",
        propertyID: "domain",
        value: SEO_BRAND.domain,
      },
      sameAs: [FACEBOOK_URL],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: LEGAL_ENTITY.contactEmail,
        url: absoluteSiteUrl("/so/contact"),
        areaServed: "SO",
        availableLanguage: ["Somali", "English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SEO_BRAND.nameCompact,
      alternateName: SEO_BRAND.alternateNames,
      url: siteUrl,
      description: SEO_BRAND.defaultDescription,
      inLanguage: ["so", "en"],
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/so/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}
