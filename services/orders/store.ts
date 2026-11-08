import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/services/storage/dataDir";
import type { Order, OrderStatus } from "@/types/commerce";

/**
 * File-backed order repository. Writes are serialised and atomic (temp file + rename).
 * Works on any long-running Node.js host with a persistent disk. For serverless
 * platforms, replace this module with a database-backed implementation that keeps
 * the same exported functions.
 */
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(orders: Order[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${ORDERS_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, ORDERS_FILE);
}

function mutate<T>(fn: (orders: Order[]) => { orders: Order[]; result: T }): Promise<T> {
  const run = writeQueue.then(async () => {
    const { orders, result } = fn(await readAll());
    await writeAll(orders);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateOrderId(): string {
  const bytes = randomBytes(8);
  return "RR-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function createOrder(order: Order): Promise<Order> {
  return mutate((orders) => ({ orders: [...orders, order], result: order }));
}

export async function findOrder(id: string): Promise<Order | undefined> {
  await writeQueue;
  return (await readAll()).find((o) => o.id === id);
}

export function updateOrder(id: string, patch: Partial<Pick<Order, "status" | "paymentSessionId">>): Promise<Order | undefined> {
  return mutate((orders) => {
    let updated: Order | undefined;
    const next = orders.map((o) => {
      if (o.id !== id) return o;
      updated = { ...o, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    });
    return { orders: next, result: updated };
  });
}

export function setOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  return updateOrder(id, { status });
}
