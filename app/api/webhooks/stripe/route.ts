import { revalidateTag } from "next/cache";
import { apiError, json } from "@/lib/api";
import { CATALOG_TAG } from "@/services/catalog";
import { setOrderStatus } from "@/services/orders/store";
import { verifyStripeSignature } from "@/services/payments/stripe";

interface StripeEvent {
  type: string;
  data: { object: { metadata?: { orderId?: string }; client_reference_id?: string; payment_status?: string } };
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return apiError(503, "Stripe webhook secret is not configured.");

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return apiError(400, "Invalid signature.");
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return apiError(400, "Invalid payload.");
  }

  const session = event.data?.object;
  const orderId = session?.metadata?.orderId ?? session?.client_reference_id;
  if (orderId) {
    if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
      await setOrderStatus(orderId, "paid");
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await setOrderStatus(orderId, "paid");
    } else if (event.type === "checkout.session.expired") {
      await setOrderStatus(orderId, "cancelled");
      revalidateTag(CATALOG_TAG, "max");
    }
  }
  return json({ received: true });
}
