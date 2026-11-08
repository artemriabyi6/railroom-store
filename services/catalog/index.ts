import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Product } from "@/types/product";
import { listProducts } from "./repository";

/** Cache tag for everything derived from the catalogue. Invalidate after any product or stock change. */
export const CATALOG_TAG = "catalog";

/**
 * The storefront's view of the catalogue. Cached and included in prerendered pages;
 * admin edits and orders call `revalidateTag(CATALOG_TAG, "max")` (stale-while-revalidate).
 */
export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return listProducts();
}
