import { absoluteSiteUrl, localePath, SEO_BRAND } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

type CaseArticleJsonLdProps = {
  locale: string;
  slug: string;
  title: string;
  description: string;
  datePublished?: string | null;
  dateModified?: string | null;
};

export function CaseArticleJsonLd({
  locale,
  slug,
  title,
  description,
  datePublished,
  dateModified,
}: CaseArticleJsonLdProps) {
  const url = absoluteSiteUrl(localePath(locale, `/cases/${slug}`));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description.slice(0, 300),
        url,
        inLanguage: locale === "so" ? "so" : "en",
        datePublished: datePublished ?? undefined,
        dateModified: dateModified ?? datePublished ?? undefined,
        author: {
          "@type": "Organization",
          name: SEO_BRAND.name,
          url: absoluteSiteUrl(),
        },
        publisher: {
          "@type": "Organization",
          name: SEO_BRAND.name,
          url: absoluteSiteUrl(),
        },
        isPartOf: {
          "@type": "WebSite",
          name: SEO_BRAND.name,
          url: absoluteSiteUrl(),
        },
        about: {
          "@type": "Thing",
          name: "Patient safety and healthcare incident documentation",
        },
      }}
    />
  );
}
