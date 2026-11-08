import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { currencies } from "@/config/site";
import type { Order } from "@/types/commerce";

/**
 * LiqPay Checkout (https://www.liqpay.ua/documentation/api/aquiring/checkout/doc).
 * Requires LIQPAY_PUBLIC_KEY and LIQPAY_PRIVATE_KEY. Sandbox mode is ON unless
 * LIQPAY_SANDBOX=0, so payments use LiqPay test cards and no money moves.
 */
const CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";
const SUPPORTED = new Set(["UAH", "USD", "EUR"]);

export function isLiqPayConfigured(): boolean {
  return Boolean(process.env.LIQPAY_PUBLIC_KEY && process.env.LIQPAY_PRIVATE_KEY);
}

export const isLiqPaySandbox = () => process.env.LIQPAY_SANDBOX !== "0";

export function sign(data: string, privateKey: string): string {
  return createHash("sha1").update(privateKey + data + privateKey).digest("base64");
}

/** LiqPay accepts UAH/USD/EUR; other display currencies are charged in EUR. */
export function chargeAmount(order: Order): { amount: number; currency: string } {
  if (SUPPORTED.has(order.currency)) return { amount: order.total / 100, currency: order.currency };
  const eurCents = Math.round(order.total / currencies[order.currency].rate);
  return { amount: eurCents / 100, currency: "EUR" };
}

export function buildCheckout(order: Order, origin: string): { url: string; fields: Record<string, string> } {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("LiqPay is not configured");
  const { amount, currency } = chargeAmount(order);
  const params: Record<string, string | number> = {
    version: 3,
    public_key: publicKey,
    action: "pay",
    amount: Number(amount.toFixed(2)),
    currency,
    description: `Order ${order.id}`,
    order_id: order.id,
    result_url: `${origin}/checkout/success?order=${order.id}`,
    server_url: `${origin}/api/payments/liqpay`,
    language: "uk",
  };
  if (isLiqPaySandbox()) params.sandbox = 1;
  const data = Buffer.from(JSON.stringify(params)).toString("base64");
  return { url: CHECKOUT_URL, fields: { data, signature: sign(data, privateKey) } };
}

export interface LiqPayCallback {
  order_id?: string;
  status?: string;
  payment_id?: number | string;
  amount?: number;
  currency?: string;
}

/** Verifies and decodes a server-to-server callback. Returns null if the signature is invalid. */
export function verifyCallback(data: string | null, signature: string | null): LiqPayCallback | null {
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!privateKey || !data || !signature) return null;
  const expected = Buffer.from(sign(data, privateKey));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as LiqPayCallback;
  } catch {
    return null;
  }
}

/** Map a LiqPay status to our order status (undefined = no change yet, e.g. 3-D Secure pending). */
export function statusFromLiqPay(status: string | undefined): "paid" | "cancelled" | undefined {
  if (status === "success" || status === "sandbox") return "paid";
  if (status === "failure" || status === "error" || status === "reversed") return "cancelled";
  return undefined;
}
