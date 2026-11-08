"use server";

import { revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateProduct } from "@/lib/productValidation";
import { rateLimit } from "@/lib/rateLimit";
import { ADMIN_COOKIE, checkPassword, createSessionToken, isAdminConfigured, requireAdmin } from "@/services/auth/adminSession";
import { CATALOG_TAG } from "@/services/catalog";
import { deleteProduct, moveProduct, OutOfStockError, ProductConflictError, saveProduct } from "@/services/catalog/repository";
import { setOrderStatus } from "@/services/orders/store";
import type { FieldErrors, OrderStatus } from "@/types/commerce";

/**
 * Refresh cached storefront pages after a catalogue change. Stale-while-revalidate
 * ("max") on purpose: shoppers keep getting the cached page while a fresh one is built
 * in the background, instead of every visitor hitting an on-demand render at once.
 * Admin pages read the database directly, so admins always see their change immediately.
 */
function refreshStorefront() {
  revalidateTag(CATALOG_TAG, "max");
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) return { error: "The admin panel is disabled. Set ADMIN_PASSWORD (at least 8 characters) in the environment." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60_000).ok) return { error: "Too many attempts. Try again in 15 minutes." };

  if (!checkPassword(String(formData.get("password") ?? ""))) return { error: "Incorrect password." };

  const { token, expires } = createSessionToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  redirect("/admin/products");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ── Products ────────────────────────────────────────────────────────────────

export type SaveProductResult = { ok: true; slug: string } | { ok: false; message: string; errors?: FieldErrors };

export async function saveProductAction(input: unknown, originalSlug: string | null): Promise<SaveProductResult> {
  await requireAdmin();
  const result = validateProduct(input);
  if (!result.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: result.errors };
  try {
    await saveProduct(result.data, originalSlug ?? undefined);
  } catch (err) {
    if (err instanceof ProductConflictError) return { ok: false, message: err.message, errors: { slug: "This slug is already used by another product." } };
    console.error("[admin] save product failed", err);
    return { ok: false, message: "Could not save the product. Please try again." };
  }
  refreshStorefront();
  return { ok: true, slug: result.data.slug };
}

/**
 * Delete a product. From the product's own edit page pass `redirectToList`: the server
 * redirects in the same response, so the client never re-renders the deleted product.
 */
export async function deleteProductAction(slug: string, options?: { redirectToList?: boolean }): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  try {
    await deleteProduct(slug);
  } catch (err) {
    console.error("[admin] delete product failed", err);
    return { ok: false, message: "Could not delete the product." };
  }
  refreshStorefront();
  if (options?.redirectToList) redirect(`/admin/products?deleted=${encodeURIComponent(slug)}`);
  return { ok: true };
}

export async function moveProductAction(slug: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  await moveProduct(slug, direction === -1 ? -1 : 1);
  refreshStorefront();
}

// ── Orders ──────────────────────────────────────────────────────────────────

const STATUSES: OrderStatus[] = ["pending_payment", "paid", "cancelled"];

export async function setOrderStatusAction(id: string, status: OrderStatus): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return { ok: false, message: "Unknown status." };
  try {
    const updated = await setOrderStatus(id, status);
    if (!updated) return { ok: false, message: "Order not found." };
  } catch (err) {
    if (err instanceof OutOfStockError) return { ok: false, message: "Not enough stock to re-open this order." };
    console.error("[admin] set order status failed", err);
    return { ok: false, message: "Could not update the order." };
  }
  // Cancelling or re-opening changes stock.
  refreshStorefront();
  return { ok: true };
}
