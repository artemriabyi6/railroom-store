"use client";

import { addLine, countItems, removeLine, sanitizeCart, setQuantity } from "@/lib/cart";
import { createStore, useStore } from "@/lib/persistentStore";
import type { CartLine } from "@/types/commerce";
import type { Size } from "@/types/product";

export const cartStore = createStore<CartLine[]>({ key: "rr.cart.v1", initial: [], revive: sanitizeCart });

/** Ephemeral UI state: whether the bag drawer is open. */
export const cartOpenStore = createStore<boolean>({ initial: false });

export const cartActions = {
  add: (slug: string, size: Size, quantity = 1) => cartStore.set((lines) => addLine(lines, slug, size, quantity)),
  setQuantity: (slug: string, size: Size, quantity: number) => cartStore.set((lines) => setQuantity(lines, slug, size, quantity)),
  remove: (slug: string, size: Size) => cartStore.set((lines) => removeLine(lines, slug, size)),
  clear: () => cartStore.set([]),
  open: () => cartOpenStore.set(true),
  close: () => cartOpenStore.set(false),
};

export function useCart() {
  const lines = useStore(cartStore);
  return { lines, count: countItems(lines) };
}

export const useCartOpen = () => useStore(cartOpenStore);
