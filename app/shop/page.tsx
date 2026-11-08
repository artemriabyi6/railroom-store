import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { ShopCatalog } from "@/features/shop/ShopCatalog";
import { ShopSkeleton } from "@/features/shop/ShopSkeleton";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all",
  description: `The full ${siteConfig.name} catalogue: shirts, outerwear, hoodies, tops and bottoms, cut in small runs.`,
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton count={Math.min(12, getProducts().length)} />}>
      <ShopCatalog />
    </Suspense>
  );
}
