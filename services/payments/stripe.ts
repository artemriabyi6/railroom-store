import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types/commerce";

/**
 * Stripe Checkout integration over the REST API (no SDK dependency).
 * Requires STRIPE_SECRET_KEY; webhook verification requires STRIPE_WEBHOOK_SECRET.
 */
const API = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(order: Order, origin: string): Promise<{ id: string; url: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/checkout/success?order=${order.id}`);
  form.set("cancel_url", `${origin}/checkout?cancelled=1`);
  form.set("customer_email", order.customer.email);
  form.set("client_reference_id", order.id);
  form.set("metadata[orderId]", order.id);
  const currency = order.currency.toLowerCase();

  order.lines.forEach((line, i) => {
    form.set(`line_items[${i}][quantity]`, String(line.quantity));
    form.set(`line_items[${i}][price_data][currency]`, currency);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(line.unitAmount));
    form.set(`line_items[${i}][price_data][product_data][name]`, `${line.name} — ${line.size}`);
  });
  if (order.shipping > 0) {
    const i = order.lines.length;
    form.set(`line_items[${i}][quantity]`, "1");
    form.set(`line_items[${i}][price_data][currency]`, currency);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(order.shipping));
    form.set(`line_items[${i}][price_data][product_data][name]`, "Shipping");
  }

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Stripe checkout session failed: ${data.error?.message ?? res.status}`);
  }
  return { id: data.id, url: data.url };
}

/** Verifies a `Stripe-Signature` header (v1 scheme). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, ...v] = kv.split("=");
      return [k.trim(), v.join("=")] as const;
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const signatures = header
    .split(",")
    .filter((p) => p.trim().startsWith("v1="))
    .map((p) => p.trim().slice(3));
  return signatures.some((sig) => {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
