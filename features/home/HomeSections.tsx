import { getNewProducts, getProduct } from "@/lib/catalog";
import type { Product } from "@/types/product";
import { BenefitsStrip } from "./BenefitsStrip";
import { CategoryTiles } from "./CategoryTiles";
import { FeaturedDrop } from "./FeaturedDrop";
import { NewInRail } from "./NewInRail";
import { Newsletter } from "./Newsletter";

/** Everything below the hero rail on the homepage. */
export function HomeSections() {
  const colourways = ["current-split-shirt", "ink-split-shirt"].map(getProduct).filter((p): p is Product => Boolean(p));
  return (
    <>
      <BenefitsStrip />
      <NewInRail products={getNewProducts()} />
      <FeaturedDrop colourways={colourways} />
      <CategoryTiles />
      <Newsletter />
    </>
  );
}
