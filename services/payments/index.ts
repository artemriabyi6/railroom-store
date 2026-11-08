import "server-only";
import type { Order } from "@/types/commerce";
import { buildCheckout, isLiqPayConfigured } from "./liqpay";
import { createCheckoutSession, isStripeConfigured } from "./stripe";

export type PaymentProviderId = "liqpay" | "stripe" | "demo";

/** How the browser should continue to payment. */
export interface PaymentStep {
  method: "GET" | "POST";
  url: string;
  fields?: Record<string, string>;
}

/**
 * Active provider. PAYMENT_PROVIDER forces one (if configured); otherwise LiqPay when
 * its keys are set, then Stripe, then the built-in demo payment.
 */
export function activePaymentProvider(): PaymentProviderId {
  const forced = process.env.PAYMENT_PROVIDER;
  if (forced === "demo") return "demo";
  if (forced === "liqpay" && isLiqPayConfigured()) return "liqpay";
  if (forced === "stripe" && isStripeConfigured()) return "stripe";
  if (isLiqPayConfigured()) return "liqpay";
  if (isStripeConfigured()) return "stripe";
  return "demo";
}

export async function startPayment(provider: PaymentProviderId, order: Order, origin: string): Promise<{ step: PaymentStep; ref: string | null }> {
  switch (provider) {
    case "liqpay": {
      const { url, fields } = buildCheckout(order, origin);
      return { step: { method: "POST", url, fields }, ref: null };
    }
    case "stripe": {
      const session = await createCheckoutSession(order, origin);
      return { step: { method: "GET", url: session.url }, ref: session.id };
    }
    default:
      return { step: { method: "GET", url: `/checkout/pay/${encodeURIComponent(order.id)}` }, ref: null };
  }
}
