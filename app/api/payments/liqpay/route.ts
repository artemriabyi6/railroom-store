import { revalidateTag } from "next/cache";
import { apiError, json } from "@/lib/api";
import { CATALOG_TAG } from "@/services/catalog";
import { findOrder, setOrderStatus } from "@/services/orders/store";
import { statusFromLiqPay, verifyCallback } from "@/services/payments/liqpay";

/**
 * LiqPay server-to-server callback (`server_url`). LiqPay POSTs form fields
 * `data` (base64 JSON) and `signature`; we verify the signature before trusting it.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "Invalid callback body.");
  }
  const payload = verifyCallback(form.get("data")?.toString() ?? null, form.get("signature")?.toString() ?? null);
  if (!payload?.order_id) return apiError(400, "Invalid signature.");

  const order = await findOrder(payload.order_id);
  if (!order) return apiError(404, "Unknown order.");

  const next = statusFromLiqPay(payload.status);
  if (next && next !== order.status) {
    await setOrderStatus(order.id, next, payload.payment_id ? String(payload.payment_id) : undefined);
    // A cancelled order returns its stock.
    if (next === "cancelled") revalidateTag(CATALOG_TAG, "max");
  }
  return json({ received: true });
}
