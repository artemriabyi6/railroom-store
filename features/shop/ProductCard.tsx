"use client";

import Link from "next/link";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { useCurrency } from "@/features/currency/currencyStore";
import { productHref, rememberReturnPath } from "@/features/rack/navigation";
import { stockLevel, totalStock } from "@/lib/catalog";
import { SIZES, type Product } from "@/types/product";
import styles from "./ProductCard.module.scss";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { formatEur } = useCurrency();
  const soldOut = totalStock(product) === 0;
  // Flag scarcity only when the whole style is running out, not when a single size is.
  const lowStock = !soldOut && totalStock(product) <= 10;

  return (
    <article className={styles.card} data-soldout={soldOut ? "" : undefined} data-priority={priority ? "" : undefined}>
      <Link
        href={productHref(product.slug)}
        className={styles.link}
        onClick={() => rememberReturnPath(window.location.pathname + window.location.search)}
      >
        <span className={styles.stage}>
          <span className={styles.rail} aria-hidden="true" />
          <span className={styles.turn}>
            <GarmentArt art={product.art} uid={`card-${product.slug}-f`} className={`${styles.face} ${styles.front}`} />
            <GarmentArt art={product.art} view="back" uid={`card-${product.slug}-b`} className={`${styles.face} ${styles.back}`} />
          </span>
          <span className={styles.badges}>
            {product.isNew && <span className={styles.badgeNew}>New</span>}
            {soldOut ? <span className={styles.badgeOut}>Sold out</span> : lowStock && <span className={styles.badgeLow}>Low stock</span>}
          </span>
        </span>
        <span className={styles.info}>
          <span className={styles.name}>{product.name}</span>
          <span className={styles.meta}>
            <span>{product.colorName}</span>
            <span className={styles.price}>{formatEur(product.priceEur)}</span>
          </span>
          <span className={styles.sizes} aria-label={`Sizes in stock: ${SIZES.filter((s) => product.stock[s] > 0).join(", ") || "none"}`}>
            {SIZES.map((s) => (
              <span key={s} className={styles.size} data-level={stockLevel(product, s)} aria-hidden="true">
                {s}
              </span>
            ))}
          </span>
        </span>
      </Link>
    </article>
  );
}
