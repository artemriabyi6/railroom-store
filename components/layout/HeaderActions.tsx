"use client";

import Link from "next/link";
import { useState } from "react";
import { BagIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { cartActions, useCart } from "@/features/cart/cartStore";
import { CurrencySelect } from "@/features/currency/CurrencySelect";
import { SearchDialog } from "@/features/search/SearchDialog";
import styles from "./Header.module.scss";

export function HeaderActions() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();

  return (
    <div className={styles.right}>
      <CurrencySelect className={styles.currency} />
      <button type="button" className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search products">
        <SearchIcon />
      </button>
      <Link href="/account" className={`${styles.iconBtn} ${styles.account}`} aria-label="Track an order">
        <UserIcon />
      </Link>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={cartActions.open}
        aria-label={count ? `Open bag, ${count} item${count === 1 ? "" : "s"}` : "Open bag, empty"}
      >
        <BagIcon />
        {count > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {count}
          </span>
        )}
      </button>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
