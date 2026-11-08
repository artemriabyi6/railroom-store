"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isOrderId, normalizeOrderId } from "@/lib/validation";
import { CATALOG_TAG } from "@/services/catalog";
import { findOrder, setOrderStatus } from "@/services/orders/store";
import { activePaymentProvider } from "@/services/payments";

/**
 * Completes a payment in demo mode (no payment provider configured). Refuses to run
 * when a real provider is active, so it can never mark a real order as paid.
 */
export async function completeDemoPayment(formData: FormData): Promise<void> {
  const orderId = normalizeOrderId(String(formData.get("orderId") ?? ""));
  const outcome = formData.get("outcome") === "success" ? "success" : "failure";
  if (!isOrderId(orderId)) throw new Error("Invalid order");
  if (activePaymentProvider() !== "demo") throw new Error("Demo payments are disabled while a payment provider is configured.");

  const order = await findOrder(orderId);
  if (!order || order.paymentProvider !== "demo") throw new Error("Order not found");

  if (order.status === "pending_payment") {
    await setOrderStatus(order.id, outcome === "success" ? "paid" : "cancelled", `demo-${Date.now()}`);
    if (outcome === "failure") revalidateTag(CATALOG_TAG, "max");
  }
  redirect(outcome === "success" ? `/checkout/success?order=${order.id}` : "/checkout?cancelled=1");
}
