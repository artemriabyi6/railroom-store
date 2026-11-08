import { shippingPolicy } from "@/config/site";
import { getProduct, isSize } from "@/lib/catalog";
import type { CartLine } from "@/types/commerce";
import type { Size } from "@/types/product";

export const lineKey = (slug: string, size: Size) => `${slug}::${size}`;

function clampQty(qty: number, slug: string, size: Size): number {
  const stock = getProduct(slug)?.stock[size] ?? 0;
  return Math.max(0, Math.min(Math.floor(qty), shippingPolicy.maxQuantityPerLine, stock));
}

export function addLine(lines: CartLine[], slug: string, size: Size, quantity = 1): CartLine[] {
  const existing = lines.find((l) => l.slug === slug && l.size === size);
  if (existing) return setQuantity(lines, slug, size, existing.quantity + quantity);
  const qty = clampQty(quantity, slug, size);
  return qty > 0 ? [...lines, { slug, size, quantity: qty }] : lines;
}

export function setQuantity(lines: CartLine[], slug: string, size: Size, quantity: number): CartLine[] {
  const qty = clampQty(quantity, slug, size);
  if (qty === 0) return removeLine(lines, slug, size);
  return lines.map((l) => (l.slug === slug && l.size === size ? { ...l, quantity: qty } : l));
}

export function removeLine(lines: CartLine[], slug: string, size: Size): CartLine[] {
  return lines.filter((l) => !(l.slug === slug && l.size === size));
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Drop malformed or no-longer-available lines (e.g. data restored from storage). */
export function sanitizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const result: CartLine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const { slug, size, quantity } = raw as Record<string, unknown>;
    if (typeof slug !== "string" || !isSize(size) || typeof quantity !== "number") continue;
    const next = addLine(result, slug, size, quantity);
    result.splice(0, result.length, ...next);
  }
  return result;
}

export function canAddMore(lines: CartLine[], slug: string, size: Size): boolean {
  const current = lines.find((l) => l.slug === slug && l.size === size)?.quantity ?? 0;
  const stock = getProduct(slug)?.stock[size] ?? 0;
  return current < Math.min(stock, shippingPolicy.maxQuantityPerLine);
}
