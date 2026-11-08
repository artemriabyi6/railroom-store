import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { Rack } from "@/features/rack/Rack";
import { productHref } from "@/features/rack/navigation";
import { HomeSections } from "@/features/home/HomeSections";
import { getProducts, getRailProducts } from "@/lib/catalog";

export default function HomePage() {
  const products = getProducts();
  return (
    <>
      <Rack railProducts={getRailProducts()} products={products} />
      <HomeSections />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: siteConfig.name, url: siteConfig.url, ...(siteConfig.instagram ? { sameAs: [siteConfig.instagram] } : {}) },
            {
              "@type": "ItemList",
              itemListElement: products.map((p, i) => ({
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
