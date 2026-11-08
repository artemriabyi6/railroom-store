import { revalidateTag } from "next/cache";
import { apiError, json, readJson } from "@/lib/api";
import { parseCart } from "@/lib/cart";
import { isCurrency } from "@/lib/currency";
import { priceCart } from "@/lib/pricing";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { validateCustomer } from "@/lib/validation";
import { CATALOG_TAG } from "@/services/catalog";
import { listProducts, OutOfStockError } from "@/services/catalog/repository";
import { notify } from "@/services/notifications/webhook";
import { generateOrderId, placeOrder, setPaymentRef } from "@/services/orders/store";
import { activePaymentProvider, startPayment } from "@/services/payments";
import type { Order } from "@/types/commerce";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "orders"), 10, 60_000);
  if (!limit.ok) return apiError(429, "Too many requests. Please try again shortly.", { retryAfter: limit.retryAfter });

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request)) as Record<string, unknown>;
  } catch {
    return apiError(400, "Invalid request body.");
  }

  const customer = validateCustomer(body.customer);
  if (!customer.ok) return apiError(422, "Please check your details.", { fields: customer.errors });

  const currency = isCurrency(body.currency) ? body.currency : null;
  if (!currency) return apiError(422, "Unsupported currency.");

  const cart = parseCart(body.items);
  if (cart.length === 0) return apiError(409, "Your bag is empty.");

  // Price against the live catalogue (not the page cache), so stock and prices are current.
  const catalog = await listProducts();
  const priced = priceCart(catalog, cart, currency);
  if (!priced.ok) return apiError(409, "Some items in your bag are no longer available. Please review your bag.", { items: priced.errors });

  const provider = activePaymentProvider();
  const now = new Date().toISOString();
  const order: Order = {
    id: generateOrderId(),
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    currency,
    lines: priced.priced.lines,
    subtotal: priced.priced.subtotal,
    shipping: priced.priced.shipping,
    total: priced.priced.total,
    customer: customer.data,
    paymentProvider: provider,
  };

  try {
    await placeOrder(order);
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return apiError(409, "Someone just bought the last one. Please review your bag.", { items: [{ slug: err.slug, size: err.size, reason: "insufficient_stock" }] });
    }
    console.error("[orders] failed to place order", err);
    return apiError(500, "We couldn't place your order. Please try again.");
  }

  // Stock changed: refresh the storefront in the background.
  revalidateTag(CATALOG_TAG, "max");
  void notify("order", { orderId: order.id, total: order.total, currency, email: order.customer.email, provider });

  try {
    const { step, ref } = await startPayment(provider, order, new URL(request.url).origin);
    if (ref) await setPaymentRef(order.id, provider, ref);
    return json({ orderId: order.id, status: order.status, provider, payment: step }, 201);
  } catch (err) {
    console.error("[orders] payment start failed", err);
    return apiError(502, "Payment provider is unavailable. Your order was saved — please try again.", { orderId: order.id });
  }
}
