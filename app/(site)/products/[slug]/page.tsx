import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { ButtonLink } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { HomeSections } from "@/features/home/HomeSections";
import { Rack } from "@/features/rack/Rack";
import { productHref } from "@/features/rack/navigation";
import { findProduct, railProducts, totalStock } from "@/lib/catalog";
import { getCatalog } from "@/services/catalog";

/**
 * Product pages are fully static: every catalogue product is prerendered via
 * generateStaticParams, products added later in the admin panel render on first
 * request, and admin edits refresh them through the "catalog" cache tag.
 * The page reads params up front, so it opts out of instant-navigation validation.
 */
export const instant = false;

export async function generateStaticParams() {
  return (await getCatalog()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(await getCatalog(), slug);
  if (!product) return { title: "No longer available", robots: { index: false, follow: true } };
  const title = `${product.name} — ${product.colorName}`;
  return {
    title,
    description: product.description,
    alternates: { canonical: productHref(product.slug) },
    openGraph: { title, description: product.description, url: productHref(product.slug), type: "website" },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = findProduct(catalog, slug);
  if (!product) {
    // Unknown or deleted product: a noindexed "no longer available" page (see generateMetadata).
    // We deliberately avoid notFound() here: a proxy or mid-stream 404 would make every
    // product page dynamic, losing static caching.
    return (
      <>
        <ContentPage eyebrow="Sold out" title="No longer on the rail" intro="This piece has been taken down. Have a look at what's hanging now.">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ButtonLink href="/shop">Shop all</ButtonLink>
          </div>
        </ContentPage>
        <HomeSections catalog={catalog} />
      </>
    );
  }
  const url = `${siteConfig.url}${productHref(product.slug)}`;

  return (
    <>
      <Rack railProducts={railProducts(catalog)} products={catalog} />
      <HomeSections catalog={catalog} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          color: product.colorName,
          brand: { "@type": "Brand", name: siteConfig.name },
          url,
          image: `${siteConfig.url}/opengraph-image`,
          offers: {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: (product.priceEur / 100).toFixed(2),
            availability: totalStock(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
          },
        }}
      />
    </>
  );
}
