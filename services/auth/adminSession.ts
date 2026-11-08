import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/**
 * Single-admin authentication: the password lives in ADMIN_PASSWORD, the session is
 * an HMAC-signed, httpOnly cookie. Changing ADMIN_PASSWORD (or ADMIN_SESSION_SECRET)
 * invalidates every existing session.
 */
export const ADMIN_COOKIE = "rr_admin";
const SESSION_HOURS = 12;

export function isAdminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 8;
}

function secret(): Buffer {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  return createHash("sha256")
    .update(explicit && explicit.length >= 16 ? explicit : `rr-admin-session:${process.env.ADMIN_PASSWORD ?? ""}`)
    .digest();
}

const signature = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  // Compare fixed-length digests so neither content nor length leaks through timing.
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

export function checkPassword(candidate: string): boolean {
  return isAdminConfigured() && safeEqual(candidate, process.env.ADMIN_PASSWORD ?? "");
}

export function createSessionToken(now = Date.now()): { token: string; expires: Date } {
  const expires = new Date(now + SESSION_HOURS * 3600_000);
  const payload = `v1.${expires.getTime()}`;
  return { token: `${payload}.${signature(payload)}`, expires };
}

export function verifySessionToken(token: string | undefined, now?: number): boolean {
  if (!token || !isAdminConfigured()) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const payload = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], signature(payload))) return false;
  const exp = Number(parts[1]);
  // Read the clock only once a token is present (keeps prerendering free of Date.now()).
  return Number.isFinite(exp) && exp > (now ?? Date.now());
}

export async function isAdmin(): Promise<boolean> {
  // Session checks are always request-time work (cookies + the current time).
  await connection();
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
