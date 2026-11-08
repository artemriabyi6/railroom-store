"use client";

import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type Ref } from "react";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { useCurrency } from "@/features/currency/currencyStore";
import type { Product } from "@/types/product";
import { productHref } from "./navigation";
import styles from "./RailList.module.scss";

export interface RailOpenEvent {
  product: Product;
  /** Bounding box of the garment artwork at click time (for FLIP animations). */
  rect: DOMRect;
  /** Whether the garment was still turned side-on when clicked. */
  rotated: boolean;
}

interface RailListProps {
  products: readonly Product[];
  /** Accessible name of the list. */
  label: string;
  onOpen: (event: RailOpenEvent) => void;
  /** Slug whose garment should be hidden (it is shown in the product panel). */
  hiddenSlug?: string | null;
  variant?: "hero" | "strip";
  /** Prefix keeping SVG ids unique when several rails render on one page. */
  idPrefix: string;
  listRef?: Ref<HTMLUListElement>;
  className?: string;
}

/**
 * The signature chrome rail: garments hang side-on and turn to face the viewer on
 * hover/focus. Arrow keys move along the rail. Used by the hero and by homepage strips.
 */
export function RailList({ products, label, onOpen, hiddenSlug, variant = "hero", idPrefix, listRef, className }: RailListProps) {
  const [active, setActive] = useState<string | null>(null);
  const { formatEur } = useCurrency();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, product: Product) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const art = event.currentTarget.querySelector("svg");
    onOpen({ product, rect: (art ?? event.currentTarget).getBoundingClientRect(), rotated: active !== product.slug });
    setActive(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[data-slug]"));
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index === -1) return;
    event.preventDefault();
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + links.length) % links.length;
    links[next]?.focus();
  };

  const activeProduct = products.find((p) => p.slug === active);

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} data-variant={variant} style={{ "--count": products.length } as CSSProperties}>
      <div className={styles.scroller}>
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.railCap} />
          <span className={styles.railBar} />
          <span className={styles.railCap} />
        </div>
        <ul ref={listRef} className={styles.items} aria-label={label} onKeyDown={onKeyDown} onMouseLeave={() => setActive(null)}>
          {products.map((product, i) => (
            <li
              key={product.slug}
              className={styles.item}
              data-active={active === product.slug ? "" : undefined}
              data-current={hiddenSlug === product.slug ? "" : undefined}
              style={{ zIndex: active === product.slug ? 50 : 10 + i }}
            >
              <a
                href={productHref(product.slug)}
                data-slug={product.slug}
                className={styles.hit}
                aria-label={`${product.name}, ${product.colorName}, ${formatEur(product.priceEur)}`}
                onMouseEnter={() => setActive(product.slug)}
                onFocus={() => setActive(product.slug)}
                onBlur={() => setActive((a) => (a === product.slug ? null : a))}
                onClick={(e) => handleClick(e, product)}
              >
                <GarmentArt art={product.art} uid={`${idPrefix}-${product.slug}`} className={styles.garment} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.caption} aria-hidden="true">
        {activeProduct ? (
          <>
            <span className={styles.captionName}>{activeProduct.name}</span>
            <span className={styles.captionSep}>—</span>
            <span>{activeProduct.colorName}</span>
            {variant === "strip" && (
              <>
                <span className={styles.captionSep}>·</span>
                <span>{formatEur(activeProduct.priceEur)}</span>
              </>
            )}
          </>
        ) : (
          <span className={styles.hint}>
            <span className={styles.hintPointer}>Hover to browse · Click to view</span>
            <span className={styles.hintTouch}>Swipe the rail · Tap to view</span>
          </span>
        )}
      </p>
    </div>
  );
}
