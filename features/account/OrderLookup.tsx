"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { formatMinor } from "@/lib/currency";
import { postJson } from "@/lib/api";
import { isEmail, isOrderId, normalizeOrderId } from "@/lib/validation";
import type { OrderStatus, OrderSummary } from "@/types/commerce";
import styles from "./OrderLookup.module.scss";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid — preparing to ship",
  cancelled: "Cancelled",
};

export function OrderLookup() {
  const initialOrder = useSearchParams().get("order") ?? "";
  const [orderId, setOrderId] = useState(initialOrder);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ orderId?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderSummary | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const id = normalizeOrderId(orderId);
    const next: typeof errors = {};
    if (!isOrderId(id)) next.orderId = "Order numbers look like RR-ABCD2345.";
    if (!isEmail(email.trim())) next.email = "Enter the email used at checkout.";
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await postJson<{ order: OrderSummary }>("/api/orders/lookup", { orderId: id, email });
    setLoading(false);
    if (res.ok) {
      setOrder(res.data.order);
      return;
    }
    setOrder(null);
    if (res.data.fields) setErrors(res.data.fields as typeof errors);
    setMessage(res.status === 0 ? "You appear to be offline." : String(res.data.error ?? "Something went wrong."));
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextField
          label="Order number"
          name="orderId"
          required
          placeholder="RR-ABCD2345"
          autoCapitalize="characters"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          error={errors.orderId}
        />
        <TextField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        {message && (
          <p className={styles.error} role="alert">
            {message}
          </p>
        )}
        <Button type="submit" block loading={loading}>
          {loading ? "Looking up…" : "Find my order"}
        </Button>
      </form>

      {order && (
        <section className={styles.result} aria-live="polite" aria-label={`Order ${order.id}`}>
          <div className={styles.resultHead}>
            <div>
              <p className={styles.label}>Order</p>
              <p className={styles.id}>{order.id}</p>
            </div>
            <span className={styles.status} data-status={order.status}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className={styles.meta}>
            Placed {new Date(order.createdAt).toLocaleDateString("en-GB", { dateStyle: "long" })} · Ships to {order.shipTo}
          </p>
          <ul className={styles.lines}>
            {order.lines.map((l) => (
              <li key={`${l.slug}-${l.size}`}>
                <span>
                  {l.quantity} × {l.name} ({l.size})
                </span>
                <span>{formatMinor(l.unitAmount * l.quantity, order.currency)}</span>
              </li>
            ))}
            <li>
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "Free" : formatMinor(order.shipping, order.currency)}</span>
            </li>
            <li className={styles.total}>
              <span>Total</span>
              <span>{formatMinor(order.total, order.currency)}</span>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
