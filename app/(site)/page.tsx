import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { HomeSections } from "@/features/home/HomeSections";
import { Rack } from "@/features/rack/Rack";
import { productHref } from "@/features/rack/navigation";
import { railProducts } from "@/lib/catalog";
import { getCatalog } from "@/services/catalog";

export default async function HomePage() {
  const catalog = await getCatalog();
  return (
    <>
      <Rack railProducts={railProducts(catalog)} products={catalog} />
      <HomeSections catalog={catalog} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: siteConfig.name, url: siteConfig.url, ...(siteConfig.instagram ? { sameAs: [siteConfig.instagram] } : {}) },
            {
              "@type": "ItemList",
              itemListElement: catalog.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${siteConfig.url}${productHref(p.slug)}`,
                name: p.name,
              })),
            },
          ],
        }}
      />
    </>
  );
}
