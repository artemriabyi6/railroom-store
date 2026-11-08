import { shippingPolicy } from "@/config/site";
import { findProduct, isSize, type Catalog } from "@/lib/catalog";
import type { CartLine } from "@/types/commerce";
import type { Size } from "@/types/product";

/** Pure cart operations. Every function that depends on stock takes the current catalogue. */

const stockOf = (catalog: Catalog, slug: string, size: Size) => findProduct(catalog, slug)?.stock[size] ?? 0;

function clampQty(catalog: Catalog, qty: number, slug: string, size: Size): number {
  return Math.max(0, Math.min(Math.floor(qty), shippingPolicy.maxQuantityPerLine, stockOf(catalog, slug, size)));
}

export function addLine(catalog: Catalog, lines: CartLine[], slug: string, size: Size, quantity = 1): CartLine[] {
  const existing = lines.find((l) => l.slug === slug && l.size === size);
  if (existing) return setQuantity(catalog, lines, slug, size, existing.quantity + quantity);
  const qty = clampQty(catalog, quantity, slug, size);
  return qty > 0 ? [...lines, { slug, size, quantity: qty }] : lines;
}

export function setQuantity(catalog: Catalog, lines: CartLine[], slug: string, size: Size, quantity: number): CartLine[] {
  const qty = clampQty(catalog, quantity, slug, size);
  if (qty === 0) return removeLine(lines, slug, size);
  return lines.map((l) => (l.slug === slug && l.size === size ? { ...l, quantity: qty } : l));
}

export function removeLine(lines: CartLine[], slug: string, size: Size): CartLine[] {
  return lines.filter((l) => !(l.slug === slug && l.size === size));
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/**
 * Structural validation of untrusted cart data (localStorage, request bodies):
 * drops malformed lines and merges duplicates. Stock is checked separately.
 */
export function parseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const result: CartLine[] = [];
  for (const raw of value.slice(0, 50)) {
    if (!raw || typeof raw !== "object") continue;
    const { slug, size, quantity } = raw as Record<string, unknown>;
    if (typeof slug !== "string" || slug.length > 80 || !isSize(size) || typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    const qty = Math.floor(quantity);
    if (qty < 1) continue;
    const existing = result.find((l) => l.slug === slug && l.size === size);
    if (existing) existing.quantity += qty;
    else result.push({ slug, size, quantity: qty });
  }
  return result;
}

/** Fit a cart to the current catalogue: drop removed products, clamp to stock. */
export function reconcileCart(catalog: Catalog, lines: CartLine[]): CartLine[] {
  return lines.reduce<CartLine[]>((acc, l) => addLine(catalog, acc, l.slug, l.size, l.quantity), []);
}

export function canAddMore(catalog: Catalog, lines: CartLine[], slug: string, size: Size): boolean {
  const current = lines.find((l) => l.slug === slug && l.size === size)?.quantity ?? 0;
  return current < Math.min(stockOf(catalog, slug, size), shippingPolicy.maxQuantityPerLine);
}
