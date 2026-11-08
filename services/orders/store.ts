import "server-only";
import { randomBytes } from "node:crypto";
import { adjustStock, type StockLine } from "@/services/catalog/repository";
import { fromJson, getDb, hasDatabase, jsonParam, type Sql } from "@/services/db/client";
import { mutateJsonFile, readJsonFile } from "@/services/storage/jsonFile";
import type { CurrencyCode, CustomerDetails, Order, OrderLine, OrderStatus } from "@/types/commerce";

/**
 * Order persistence: Postgres when DATABASE_URL is set, otherwise a JSON file.
 * Placing an order reserves stock in the same transaction; cancelling releases it.
 */

const FILE = "orders";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderId(): string {
  return "RR-" + Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const toStockLines = (lines: OrderLine[]): StockLine[] => lines.map(({ slug, size, quantity }) => ({ slug, size, quantity }));

interface OrderRow {
  id: string;
  status: OrderStatus;
  currency: CurrencyCode;
  lines: unknown;
  subtotal: number;
  shipping: number;
  total: number;
  customer: unknown;
  payment_provider: string | null;
  payment_ref: string | null;
  created_at: Date;
  updated_at: Date;
}

function fromRow(r: OrderRow): Order {
  const order: Order = {
    id: r.id,
    status: r.status,
    currency: r.currency,
    lines: fromJson<OrderLine[]>(r.lines),
    subtotal: r.subtotal,
    shipping: r.shipping,
    total: r.total,
    customer: fromJson<CustomerDetails>(r.customer),
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
  if (r.payment_provider) order.paymentProvider = r.payment_provider;
  if (r.payment_ref) order.paymentRef = r.payment_ref;
  return order;
}

/** Reserve stock and store the order atomically. Throws OutOfStockError when stock ran out. */
export async function placeOrder(order: Order): Promise<Order> {
  if (hasDatabase()) {
    const sql = await getDb();
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      await adjustStock(toStockLines(order.lines), -1, tx);
      await tx`
        insert into orders (id, status, currency, lines, subtotal, shipping, total, customer, payment_provider, payment_ref, created_at, updated_at)
        values (${order.id}, ${order.status}, ${order.currency}, ${jsonParam(tx, order.lines)}, ${order.subtotal}, ${order.shipping},
                ${order.total}, ${jsonParam(tx, order.customer)}, ${order.paymentProvider ?? null}, ${order.paymentRef ?? null},
                ${order.createdAt}::timestamptz, ${order.updatedAt}::timestamptz)`;
    });
    return order;
  }
  await adjustStock(toStockLines(order.lines), -1);
  try {
    await mutateJsonFile<Order[], void>(FILE, () => [], (all) => ({ data: [...all, order], result: undefined }));
  } catch (err) {
    await adjustStock(toStockLines(order.lines), 1);
    throw err;
  }
  return order;
}

export async function findOrder(id: string): Promise<Order | undefined> {
  if (hasDatabase()) {
    const sql = await getDb();
    const [row] = await sql<OrderRow[]>`select * from orders where id = ${id}`;
    return row ? fromRow(row) : undefined;
  }
  return (await readJsonFile<Order[]>(FILE, () => [])).find((o) => o.id === id);
}

export async function listOrders(limit = 200): Promise<Order[]> {
  if (hasDatabase()) {
    const sql = await getDb();
    const rows = await sql<OrderRow[]>`select * from orders order by created_at desc limit ${limit}`;
    return rows.map(fromRow);
  }
  const all = await readJsonFile<Order[]>(FILE, () => []);
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function setPaymentRef(id: string, provider: string, ref: string | null): Promise<void> {
  if (hasDatabase()) {
    const sql = await getDb();
    await sql`update orders set payment_provider = ${provider}, payment_ref = ${ref}, updated_at = now() where id = ${id}`;
    return;
  }
  await mutateJsonFile<Order[], void>(FILE, () => [], (all) => ({
    data: all.map((o) => (o.id === id ? { ...o, paymentProvider: provider, paymentRef: ref ?? undefined, updatedAt: new Date().toISOString() } : o)),
    result: undefined,
  }));
}

/**
 * Change an order's status, keeping stock consistent: cancelling releases the
 * reserved items, re-opening a cancelled order reserves them again.
 * Returns the updated order, or undefined if it doesn't exist.
 */
export async function setOrderStatus(id: string, status: OrderStatus, paymentRef?: string): Promise<Order | undefined> {
  if (hasDatabase()) {
    const sql = await getDb();
    return sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      const [row] = await tx<OrderRow[]>`select * from orders where id = ${id} for update`;
      if (!row) return undefined;
      const current = fromRow(row);
      if (current.status === status) return current;
      if (status === "cancelled") await adjustStock(toStockLines(current.lines), 1, tx);
      if (current.status === "cancelled") await adjustStock(toStockLines(current.lines), -1, tx);
      const [updated] = await tx<OrderRow[]>`
        update orders set status = ${status}, payment_ref = coalesce(${paymentRef ?? null}, payment_ref), updated_at = now()
         where id = ${id} returning *`;
      return fromRow(updated);
    });
  }
  const current = await findOrder(id);
  if (!current) return undefined;
  if (current.status === status) return current;
  if (status === "cancelled") await adjustStock(toStockLines(current.lines), 1);
  if (current.status === "cancelled") await adjustStock(toStockLines(current.lines), -1);
  return mutateJsonFile<Order[], Order | undefined>(FILE, () => [], (all) => {
    let updated: Order | undefined;
    const data = all.map((o) => {
      if (o.id !== id) return o;
      updated = { ...o, status, paymentRef: paymentRef ?? o.paymentRef, updatedAt: new Date().toISOString() };
      return updated;
    });
    return { data, result: updated };
  });
}
