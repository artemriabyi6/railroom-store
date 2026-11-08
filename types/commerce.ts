import type { Size } from "./product";

export const CURRENCIES = ["EUR", "UAH", "USD", "GBP", "NGN"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export interface CartLine {
  slug: string;
  size: Size;
  quantity: number;
}

export interface CustomerDetails {
  email: string;
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = "pending_payment" | "paid" | "cancelled";

export interface OrderLine {
  slug: string;
  name: string;
  size: Size;
  quantity: number;
  /** Unit price in the order currency's minor units. */
  unitAmount: number;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  currency: CurrencyCode;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: CustomerDetails;
  /** Which payment integration handled the order: "liqpay" | "stripe" | "demo". */
  paymentProvider?: string;
  /** Provider-side reference (session id, LiqPay payment id…). */
  paymentRef?: string;
}

/** Public, non-sensitive view of an order returned by lookup. */
export type OrderSummary = Pick<
  Order,
  "id" | "createdAt" | "status" | "currency" | "lines" | "subtotal" | "shipping" | "total"
> & { shipTo: string };

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export type ValidationResult<T, K extends string = string> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors<K> };
