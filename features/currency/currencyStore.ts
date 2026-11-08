"use client";

import { DEFAULT_CURRENCY } from "@/config/site";
import { formatEurIn, formatMinor, isCurrency } from "@/lib/currency";
import { createStore, useStore } from "@/lib/persistentStore";
import type { CurrencyCode } from "@/types/commerce";

export const currencyStore = createStore<CurrencyCode>({
  key: "rr.currency.v1",
  initial: DEFAULT_CURRENCY,
  revive: (v) => (isCurrency(v) ? v : DEFAULT_CURRENCY),
});

export function useCurrency() {
  const currency = useStore(currencyStore);
  return {
    currency,
    setCurrency: (c: CurrencyCode) => currencyStore.set(c),
    /** Format a catalogue price (euro cents) in the active currency. */
    formatEur: (eurCents: number) => formatEurIn(eurCents, currency),
    formatMinor: (minor: number, code: CurrencyCode = currency) => formatMinor(minor, code),
  };
}
