import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { Rack } from "@/features/rack/Rack";
import { productHref } from "@/features/rack/navigation";
import { HomeSections } from "@/features/home/HomeSections";
import { getProduct, getProducts, getRailProducts, totalStock } from "@/lib/catalog";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const title = `${product.name} — ${product.colorName}`;
  return {
    title,
    description: product.description,
    alternates: { canonical: productHref(product.slug) },
    openGraph: { title, description: product.description, url: productHref(product.slug), type: "website" },
  };
}

/**
 * The rack (and the open product panel) derives its state from the URL on the client,
 * so the page shell renders without awaiting params. Params are only read inside
 * Suspense for validation and structured data.
 */
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <>
      <Rack railProducts={getRailProducts()} products={getProducts()} />
      <HomeSections />
      <Suspense fallback={null}>
        <ProductStructuredData params={params} />
      </Suspense>
    </>
  );
}

async function ProductStructuredData({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const url = `${siteConfig.url}${productHref(product.slug)}`;
  return (
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
  );
}
