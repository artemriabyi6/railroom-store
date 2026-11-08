"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "@/components/ui/toastStore";
import { formatMinor } from "@/lib/currency";
import type { Order, OrderStatus } from "@/types/commerce";
import { setOrderStatusAction } from "./actions";
import styles from "./Admin.module.scss";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);
  const paidTotalEur = orders.filter((o) => o.status === "paid" && o.currency === "EUR").reduce((s, o) => s + o.total, 0);

  const change = (order: Order, status: OrderStatus) => {
    if (status === order.status) return;
    if (status === "cancelled" && !window.confirm(`Cancel ${order.id}? Its items go back into stock.`)) return;
    startTransition(async () => {
      const res = await setOrderStatusAction(order.id, status);
      if (res.ok) {
        toast(`${order.id}: ${STATUS_LABEL[status]}`, "success");
        router.refresh();
      } else toast(res.message ?? "Could not update the order.", "error");
    });
  };

  return (
    <section aria-labelledby="orders-title">
      <div className={styles.pageHead}>
        <div>
          <h1 id="orders-title" className={styles.pageTitle}>
            Orders
          </h1>
          <p className={styles.muted}>
            {orders.length} orders · {orders.filter((o) => o.status === "pending_payment").length} awaiting payment · {formatMinor(paidTotalEur, "EUR")} paid in EUR
          </p>
        </div>
        <select className={styles.input} value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "all")} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>No orders yet.</p>
      ) : (
        <div className={styles.tableWrap} aria-busy={pending}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <OrderRow key={o.id} order={o} expanded={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onStatus={(s) => change(o, s)} busy={pending} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OrderRow({ order, expanded, onToggle, onStatus, busy }: { order: Order; expanded: boolean; onToggle: () => void; onStatus: (s: OrderStatus) => void; busy: boolean }) {
  const items = order.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <>
      <tr>
        <td>
          <button type="button" className={styles.rowTitle} onClick={onToggle} aria-expanded={expanded}>
            {order.id}
          </button>
          <span className={styles.muted}>{dateFmt.format(new Date(order.createdAt))}</span>
        </td>
        <td>
          {order.customer.fullName}
          <span className={styles.muted}>{order.customer.email}</span>
        </td>
        <td>{items}</td>
        <td>{formatMinor(order.total, order.currency)}</td>
        <td>
          <span className={styles.provider}>{order.paymentProvider ?? "—"}</span>
          {order.paymentRef && <span className={styles.muted}>{order.paymentRef}</span>}
        </td>
        <td>
          <select
            className={styles.statusSelect}
            data-status={order.status}
            value={order.status}
            onChange={(e) => onStatus(e.target.value as OrderStatus)}
            disabled={busy}
            aria-label={`Status of ${order.id}`}
          >
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </td>
      </tr>
      {expanded && (
        <tr className={styles.detailRow}>
          <td colSpan={6}>
            <div className={styles.orderDetail}>
              <div>
                <p className={styles.label}>Items</p>
                <ul>
                  {order.lines.map((l) => (
                    <li key={`${l.slug}-${l.size}`}>
                      {l.quantity} × {l.name} ({l.size}) — {formatMinor(l.unitAmount * l.quantity, order.currency)}
                    </li>
                  ))}
                  <li>Shipping — {order.shipping === 0 ? "Free" : formatMinor(order.shipping, order.currency)}</li>
                </ul>
              </div>
              <div>
                <p className={styles.label}>Ship to</p>
                <p>
                  {order.customer.fullName}
                  <br />
                  {order.customer.address1}
                  {order.customer.address2 && (
                    <>
                      <br />
                      {order.customer.address2}
                    </>
                  )}
                  <br />
                  {order.customer.postalCode} {order.customer.city}
                  <br />
                  {order.customer.country}
                  {order.customer.phone && (
                    <>
                      <br />
                      {order.customer.phone}
                    </>
                  )}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
