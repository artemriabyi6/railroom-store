import { apiError, json, readJson } from "@/lib/api";
import { sanitizeCart } from "@/lib/cart";
import { isCurrency } from "@/lib/currency";
import { priceCart } from "@/lib/pricing";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { validateCustomer } from "@/lib/validation";
import { deliverEvent } from "@/services/notifications/webhook";
import { createOrder, generateOrderId, updateOrder } from "@/services/orders/store";
import { createCheckoutSession, isStripeConfigured } from "@/services/payments/stripe";
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

  const items = Array.isArray(body.items) ? body.items : [];
  const cart = sanitizeCart(items);
  if (cart.length === 0 || cart.length !== items.length) {
    return apiError(409, "Some items in your bag are no longer available. Please review your bag.");
  }

  const priced = priceCart(cart, currency);
  if (!priced.ok) return apiError(409, "Some items in your bag are no longer available.", { items: priced.errors });

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
  };

  try {
    await createOrder(order);
  } catch (err) {
    console.error("[orders] failed to persist order", err);
    return apiError(500, "We couldn't place your order. Please try again.");
  }

  deliverEvent("order", { orderId: order.id, total: order.total, currency, email: order.customer.email }).catch((err) =>
    console.error("[orders] notification failed", err),
  );

  if (isStripeConfigured()) {
    try {
      const session = await createCheckoutSession(order, new URL(request.url).origin);
      await updateOrder(order.id, { paymentSessionId: session.id });
      return json({ orderId: order.id, status: order.status, paymentUrl: session.url }, 201);
    } catch (err) {
      console.error("[orders] payment session failed", err);
      return apiError(502, "Payment provider is unavailable. Your order was saved — please try again.", { orderId: order.id });
    }
  }

  return json({ orderId: order.id, status: order.status, paymentUrl: null }, 201);
}
