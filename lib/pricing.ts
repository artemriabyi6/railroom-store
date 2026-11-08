import { shippingPolicy } from "@/config/site";
import { getProduct } from "@/lib/catalog";
import { convertFromEur } from "@/lib/currency";
import type { CartLine, CurrencyCode, OrderLine } from "@/types/commerce";

export interface PricedCart {
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: CurrencyCode;
}

export type PriceError = { slug: string; size: string; reason: "unknown_product" | "insufficient_stock" };

/**
 * Prices a cart against the authoritative catalogue. Used on the client for display
 * and on the server when creating orders, so totals always agree.
 */
export function priceCart(
  cart: CartLine[],
  currency: CurrencyCode,
): { ok: true; priced: PricedCart } | { ok: false; errors: PriceError[] } {
  const errors: PriceError[] = [];
  const lines: OrderLine[] = [];
  let subtotalEur = 0;

  for (const line of cart) {
    const product = getProduct(line.slug);
    if (!product) {
      errors.push({ slug: line.slug, size: line.size, reason: "unknown_product" });
      continue;
    }
    if (line.quantity < 1 || line.quantity > product.stock[line.size] || line.quantity > shippingPolicy.maxQuantityPerLine) {
      errors.push({ slug: line.slug, size: line.size, reason: "insufficient_stock" });
      continue;
    }
    subtotalEur += product.priceEur * line.quantity;
    lines.push({
      slug: product.slug,
      name: product.name,
      size: line.size,
      quantity: line.quantity,
      unitAmount: convertFromEur(product.priceEur, currency),
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  const shippingEur = lines.length === 0 || subtotalEur >= shippingPolicy.freeFromEur ? 0 : shippingPolicy.flatEur;
  const subtotal = lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0);
  const shipping = convertFromEur(shippingEur, currency);
  return { ok: true, priced: { lines, subtotal, shipping, total: subtotal + shipping, currency } };
}
