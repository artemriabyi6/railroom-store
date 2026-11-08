import "server-only";
import { fromJson, getDb, hasDatabase, jsonParam } from "@/services/db/client";
import { mutateJsonFile, readJsonFile } from "@/services/storage/jsonFile";

/** Contact messages and newsletter subscriptions. */
export type MessageKind = "contact" | "newsletter";

export interface StoredMessage {
  id: string;
  kind: MessageKind;
  email: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const FILE = "messages";

/** Stores a message. Newsletter signups are de-duplicated by email (returns false if already subscribed). */
export async function saveMessage(kind: MessageKind, email: string, payload: Record<string, unknown>): Promise<boolean> {
  if (hasDatabase()) {
    const sql = await getDb();
    const rows = await sql`
      insert into messages (kind, email, payload) values (${kind}, ${email}, ${jsonParam(sql, payload)})
      on conflict do nothing returning id`;
    return rows.length > 0;
  }
  return mutateJsonFile<StoredMessage[], boolean>(FILE, () => [], (all) => {
    if (kind === "newsletter" && all.some((m) => m.kind === "newsletter" && m.email === email)) return { data: all, result: false };
    const message: StoredMessage = { id: String(all.length + 1), kind, email, payload, createdAt: new Date().toISOString() };
    return { data: [...all, message], result: true };
  });
}

export async function listMessages(kind: MessageKind, limit = 300): Promise<StoredMessage[]> {
  if (hasDatabase()) {
    const sql = await getDb();
    const rows = await sql<{ id: string; kind: MessageKind; email: string; payload: unknown; created_at: Date }[]>`
      select id::text as id, kind, email, payload, created_at from messages where kind = ${kind} order by created_at desc limit ${limit}`;
    return rows.map((r) => ({ id: r.id, kind: r.kind, email: r.email, payload: fromJson(r.payload), createdAt: new Date(r.created_at).toISOString() }));
  }
  const all = await readJsonFile<StoredMessage[]>(FILE, () => []);
  return all.filter((m) => m.kind === kind).reverse().slice(0, limit);
}
