import { useSyncExternalStore } from "react";

export interface Store<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  getServerSnapshot(): T;
}

interface Options<T> {
  /** localStorage key. When omitted the store is in-memory only. */
  key?: string;
  initial: T;
  /** Parse a persisted value, returning `initial` (or a cleaned value) if it is invalid. */
  revive?: (value: unknown) => T;
}

/**
 * Minimal external store with optional localStorage persistence and cross-tab sync.
 * Server renders always see `initial`, so hydration is deterministic.
 */
export function createStore<T>({ key, initial, revive }: Options<T>): Store<T> {
  let state = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const read = () => {
    if (!key || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed: unknown = JSON.parse(raw);
        state = revive ? revive(parsed) : (parsed as T);
      }
    } catch {
      state = initial;
    }
  };

  const ensureHydrated = () => {
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      read();
      if (key) {
        window.addEventListener("storage", (e) => {
          if (e.key !== key) return;
          read();
          listeners.forEach((l) => l());
        });
      }
    }
  };

  return {
    get() {
      ensureHydrated();
      return state;
    },
    set(next) {
      ensureHydrated();
      state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      if (key) {
        try {
          window.localStorage.setItem(key, JSON.stringify(state));
        } catch {
          /* storage may be full or disabled; state still lives in memory */
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getServerSnapshot: () => initial,
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
