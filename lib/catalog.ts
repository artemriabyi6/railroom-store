import { products } from "@/data/products";
import { SIZES, type Product, type ProductCategory, type Size } from "@/types/product";

export function getProducts(): readonly Product[] {
  return products;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Garments that hang on the homepage hero rail, in catalogue order. */
export function getRailProducts(): Product[] {
  return products.filter((p) => p.rail);
}

export function getNewProducts(): Product[] {
  return products.filter((p) => p.isNew);
}

export function getCategoryProducts(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

/** Same category first, then other new pieces — never the product itself. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const same = products.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = products.filter((p) => p.slug !== product.slug && p.category !== product.category && p.isNew);
  return [...same, ...others].slice(0, limit);
}

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

export function totalStock(product: Product): number {
  return SIZES.reduce((sum, size) => sum + product.stock[size], 0);
}

export type StockLevel = "out" | "low" | "in";

export function stockLevel(product: Product, size: Size): StockLevel {
  const qty = product.stock[size];
  if (qty <= 0) return "out";
  if (qty <= 2) return "low";
  return "in";
}

export const categoryLabels: Record<ProductCategory, string> = {
  shirts: "Shirts",
  outerwear: "Outerwear",
  hoodies: "Hoodies",
  tops: "Tops",
  bottoms: "Bottoms",
};

export const CATEGORIES = Object.keys(categoryLabels) as ProductCategory[];

export function isCategory(value: unknown): value is ProductCategory {
  return typeof value === "string" && (CATEGORIES as string[]).includes(value);
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((o) => o.value === value);
}

export interface ProductQuery {
  text?: string;
  category?: ProductCategory | "all";
  /** Only products with stock in this size. */
  size?: Size | null;
  inStockOnly?: boolean;
  sort?: SortKey;
}

/** Pure search / filter / sort over the catalogue (stable for equal keys). */
export function searchProducts(
  list: readonly Product[],
  { text = "", category = "all", size = null, inStockOnly = false, sort = "featured" }: ProductQuery,
): Product[] {
  const terms = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = list.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (size && p.stock[size] <= 0) return false;
    if (inStockOnly && totalStock(p) === 0) return false;
    if (terms.length === 0) return true;
    const haystack = `${p.name} ${p.colorName} ${categoryLabels[p.category]} ${p.description}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
  switch (sort) {
    case "new":
      return filtered.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    case "price-asc":
      return filtered.sort((a, b) => a.priceEur - b.priceEur);
    case "price-desc":
      return filtered.sort((a, b) => b.priceEur - a.priceEur);
    case "name":
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return filtered;
  }
}
