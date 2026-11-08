"use client";

import { currencies } from "@/config/site";
import { ChevronDownIcon } from "@/components/ui/icons";
import { isCurrency } from "@/lib/currency";
import { CURRENCIES } from "@/types/commerce";
import { Flag } from "./Flag";
import styles from "./CurrencySelect.module.scss";
import { useCurrency } from "./currencyStore";

export function CurrencySelect({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <span className="visually-hidden">Currency</span>
      <Flag code={currency} className={styles.flag} />
      <select
        className={styles.select}
        value={currency}
        onChange={(e) => {
          if (isCurrency(e.target.value)) setCurrency(e.target.value);
        }}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c} — {currencies[c].label}
          </option>
        ))}
      </select>
      <span className={styles.code} aria-hidden="true">
        {currency}
      </span>
      <ChevronDownIcon size={12} className={styles.chevron} />
    </label>
  );
}
