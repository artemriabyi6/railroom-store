import { findProduct, newProducts, type Catalog } from "@/lib/catalog";
import type { Product } from "@/types/product";
import { BenefitsStrip } from "./BenefitsStrip";
import { CategoryTiles } from "./CategoryTiles";
import { FeaturedDrop } from "./FeaturedDrop";
import { NewInRail } from "./NewInRail";
import { Newsletter } from "./Newsletter";

/** Everything below the hero rail on the homepage. Sections hide themselves when the catalogue has nothing for them. */
export function HomeSections({ catalog }: { catalog: Catalog }) {
  const colourways = ["current-split-shirt", "ink-split-shirt"].map((slug) => findProduct(catalog, slug)).filter((p): p is Product => Boolean(p));
  const fresh = newProducts(catalog);
  return (
    <>
      <BenefitsStrip />
      {fresh.length > 0 && <NewInRail products={fresh} />}
      {colourways.length > 0 && <FeaturedDrop colourways={colourways} />}
      <CategoryTiles catalog={catalog} />
      <Newsletter />
    </>
  );
}
