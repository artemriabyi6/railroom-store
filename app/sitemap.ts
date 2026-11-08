import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { productHref } from "@/features/rack/navigation";
import { getProducts } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...getProducts().map((p) => ({ url: `${base}${productHref(p.slug)}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/shipping`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/account`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
