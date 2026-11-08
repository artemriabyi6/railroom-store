import { apiError, json, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { isEmail, isOrderId, normalizeOrderId } from "@/lib/validation";
import { findOrder } from "@/services/orders/store";
import type { OrderSummary } from "@/types/commerce";

/** Order tracking: requires both the order number and the email used at checkout. */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "lookup"), 20, 60_000);
  if (!limit.ok) return apiError(429, "Too many attempts. Please wait a minute and try again.");

  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 2_000)) as Record<string, unknown>;
  } catch {
    return apiError(400, "Invalid request body.");
  }

  const id = normalizeOrderId(String(body.orderId ?? ""));
  const email = String(body.email ?? "").trim().toLowerCase();
  const fields: Record<string, string> = {};
  if (!isOrderId(id)) fields.orderId = "Order numbers look like RR-ABCD2345.";
  if (!isEmail(email)) fields.email = "Enter the email used at checkout.";
  if (Object.keys(fields).length) return apiError(422, "Please check your details.", { fields });

  const order = await findOrder(id);
  if (!order || order.customer.email !== email) {
    return apiError(404, "We couldn't find an order matching those details.");
  }

  const summary: OrderSummary = {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    currency: order.currency,
    lines: order.lines,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    shipTo: `${order.customer.city}, ${order.customer.country}`,
  };
  return json({ order: summary });
}
