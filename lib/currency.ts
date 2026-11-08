import { currencies, DEFAULT_CURRENCY } from "@/config/site";
import { CURRENCIES, type CurrencyCode } from "@/types/commerce";

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Convert an amount in euro cents to minor units of the target currency (all supported currencies use 2 decimals). */
export function convertFromEur(eurCents: number, currency: CurrencyCode): number {
  return Math.round(eurCents * currencies[currency].rate);
}

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

/** Format an amount given in minor units of `currency`. */
export function formatMinor(amountMinor: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(currencies[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, f);
  }
  return f.format(amountMinor / 100);
}

export function formatEurIn(eurCents: number, currency: CurrencyCode): string {
  return formatMinor(convertFromEur(eurCents, currency), currency);
}
