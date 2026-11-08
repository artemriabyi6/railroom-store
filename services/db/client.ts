import "server-only";
import postgres from "postgres";
import { SCHEMA_SQL } from "./schema";

/**
 * Postgres connection (Neon, Vercel Postgres, Supabase, RDS…). Configured by
 * `DATABASE_URL` (or `POSTGRES_URL`, which the Vercel/Neon integration sets).
 * When neither is set, repositories fall back to JSON files (see services/storage).
 */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export type Sql = postgres.Sql;

let client: Sql | null = null;
let ready: Promise<Sql> | null = null;

export function hasDatabase(): boolean {
  return url.length > 0;
}

/** Connected client with the schema applied. Safe to call on every request. */
export function getDb(): Promise<Sql> {
  if (!url) return Promise.reject(new Error("DATABASE_URL is not configured"));
  if (!ready) {
    client ??= postgres(url, {
      // Serverless functions: keep the pool tiny and let idle sockets close.
      max: Number(process.env.DATABASE_POOL_MAX) || 3,
      idle_timeout: 20,
      connect_timeout: 10,
      // Works through transaction-mode poolers (Neon/Supabase "-pooler" URLs).
      prepare: false,
      onnotice: () => {},
    });
    const sql = client;
    ready = sql
      .unsafe(SCHEMA_SQL)
      .then(() => sql)
      .catch((err) => {
        ready = null; // retry on the next request
        throw err;
      });
  }
  return ready;
}

/** jsonb values may arrive parsed or as text depending on driver/type configuration. */
export function fromJson<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

/**
 * A jsonb query parameter. The driver serialises JSON itself, so values must be
 * passed as objects through sql.json() — never pre-stringified (that double-encodes).
 */
export function jsonParam(sql: Sql, value: unknown) {
  return sql.json(value as Parameters<Sql["json"]>[0]);
}
