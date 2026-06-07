import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export function BreadcrumbJsonLd({ locale, items }: { locale: string; items: BreadcrumbItem[] }) {
  return <JsonLd data={buildBreadcrumbJsonLd(items, locale)} />;
}
