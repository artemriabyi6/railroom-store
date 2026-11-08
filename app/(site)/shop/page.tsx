import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { ShopCatalog } from "@/features/shop/ShopCatalog";
import { ShopSkeleton } from "@/features/shop/ShopSkeleton";

export const metadata: Metadata = {
  title: "Shop all",
  description: `The full ${siteConfig.name} catalogue: shirts, outerwear, hoodies, tops and bottoms, cut in small runs.`,
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton count={12} />}>
      <ShopCatalog />
    </Suspense>
  );
}
