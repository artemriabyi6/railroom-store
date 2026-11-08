"use client";

import { createStore, useStore } from "@/lib/persistentStore";

export interface Toast {
  id: number;
  message: string;
  tone: "neutral" | "success" | "error";
}

const toastStore = createStore<Toast[]>({ initial: [] });
let nextId = 1;

export function toast(message: string, tone: Toast["tone"] = "neutral", durationMs = 3200) {
  const id = nextId++;
  toastStore.set((list) => [...list.slice(-2), { id, message, tone }]);
  window.setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id: number) {
  toastStore.set((list) => list.filter((t) => t.id !== id));
}

export const useToasts = () => useStore(toastStore);
