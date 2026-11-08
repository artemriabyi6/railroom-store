"use client";

import { useMemo } from "react";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { addLine, countItems, parseCart, reconcileCart, removeLine, setQuantity } from "@/lib/cart";
import type { Catalog } from "@/lib/catalog";
import { createStore, useStore } from "@/lib/persistentStore";
import type { CartLine } from "@/types/commerce";
import type { Size } from "@/types/product";

export const cartStore = createStore<CartLine[]>({ key: "rr.cart.v1", initial: [], revive: parseCart });

/** Ephemeral UI state: whether the bag drawer is open. */
export const cartOpenStore = createStore<boolean>({ initial: false });

export const cartActions = {
  add: (catalog: Catalog, slug: string, size: Size, quantity = 1) => cartStore.set((lines) => addLine(catalog, lines, slug, size, quantity)),
  setQuantity: (catalog: Catalog, slug: string, size: Size, quantity: number) =>
    cartStore.set((lines) => setQuantity(catalog, lines, slug, size, quantity)),
  remove: (slug: string, size: Size) => cartStore.set((lines) => removeLine(lines, slug, size)),
  clear: () => cartStore.set([]),
  open: () => cartOpenStore.set(true),
  close: () => cartOpenStore.set(false),
};

/**
 * The bag, reconciled with the live catalogue: products removed by an admin
 * disappear and quantities are clamped to current stock.
 */
export function useCart() {
  const raw = useStore(cartStore);
  const catalog = useCatalog();
  const lines = useMemo(() => (catalog.length ? reconcileCart(catalog, raw) : raw), [catalog, raw]);
  return { lines, count: countItems(lines) };
}

export const useCartOpen = () => useStore(cartOpenStore);
