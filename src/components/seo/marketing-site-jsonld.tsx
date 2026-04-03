import { buildMarketingSiteJsonLd } from "@/lib/seo/site-jsonld";

/** Organization + WebSite JSON-LD once per marketing document (inherited layout). */
export function MarketingSiteJsonLd({ locale }: { locale: string }) {
  const graph = buildMarketingSiteJsonLd(locale);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
