"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { GarmentArt, type GarmentView } from "@/components/garment/GarmentArt";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { toast } from "@/components/ui/toastStore";
import { cartActions, cartStore, useCart } from "@/features/cart/cartStore";
import { useCurrency } from "@/features/currency/currencyStore";
import { canAddMore } from "@/lib/cart";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { relatedProducts, stockLevel } from "@/lib/catalog";
import { SIZES, type Product, type Size } from "@/types/product";
import { AvailabilityDialog } from "./AvailabilityDialog";
import { productHref } from "./navigation";
import styles from "./ProductPanel.module.scss";

export interface PanelOrigin {
  rect: DOMRect;
  /** Whether the garment was still turned side-on when clicked. */
  rotated: boolean;
}

interface ProductPanelProps {
  product: Product;
  origin: PanelOrigin | null;
  onClose: () => void;
  /** Open another product (keeps the panel in place, swaps its content). */
  onOpenRelated: (slug: string) => void;
}

export function ProductPanel({ product, origin, onClose, onOpenRelated }: ProductPanelProps) {
  const catalog = useCatalog();
  const related = relatedProducts(catalog, product, 4);
  const [view, setView] = useState<GarmentView>("front");
  const [size, setSize] = useState<Size | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const figureRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const headingId = useId();
  const { formatEur } = useCurrency();
  const { lines } = useCart();

  // FLIP: animate the garment from its position on the rail into the panel.
  useLayoutEffect(() => {
    const el = figureRef.current;
    if (!el || !origin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = el.getBoundingClientRect();
    const scale = origin.rect.height / target.height;
    const dx = origin.rect.left + origin.rect.width / 2 - (target.left + target.width / 2);
    const dy = origin.rect.top - target.top;
    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale}) perspective(1000px) rotateY(${origin.rotated ? 66 : 0}deg)`,
        },
        { transform: "none" },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, [origin]);

  // Escape closes the panel (unless a dialog on top handles it first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move focus into the panel for keyboard and screen-reader users.
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  const soldOut = SIZES.every((s) => product.stock[s] <= 0);
  const maxed = size ? !canAddMore(catalog, lines, product.slug, size) : false;

  const addToBag = () => {
    if (!size) return;
    if (!canAddMore(catalog, cartStore.get(), product.slug, size)) {
      toast(`You already have the maximum available in size ${size}.`, "error");
      return;
    }
    cartActions.add(catalog, product.slug, size);
    // The bag drawer opening (with an aria-labelled title) is the confirmation.
    cartActions.open();
  };

  return (
    <article ref={panelRef} className={styles.panel} aria-labelledby={headingId} tabIndex={-1}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close product">
        <CloseIcon size={18} />
      </button>

      <div ref={figureRef} className={styles.figure}>
        {/* Both sides are rendered once; toggling only rotates the hanger, so nothing re-mounts or re-paints. */}
        <div className={styles.turn} data-view={view}>
          {(["front", "back"] as const).map((side) => (
            <GarmentArt
              key={side}
              art={product.art}
              view={side}
              uid={`panel-${product.slug}-${side}`}
              label={side === view ? `${product.name} in ${product.colorName}, ${side} view` : undefined}
              className={`${styles.garment} ${styles.face} ${side === "back" ? styles.backFace : ""}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.info}>
        <h2 id={headingId} className={styles.name}>
          {product.name}
        </h2>
        <p className={styles.price}>
          {formatEur(product.priceEur)}
          <span className="visually-hidden">, colour {product.colorName}</span>
        </p>

        <div className={styles.toggle} role="group" aria-label="Garment view">
          {(["front", "back"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} className={styles.toggleBtn}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>

        <fieldset className={styles.sizes}>
          <legend className="visually-hidden">Choose a size</legend>
          {SIZES.map((s) => {
            const level = stockLevel(product, s);
            return (
              <label key={s} className={styles.size} data-level={level} title={level === "out" ? "Sold out" : level === "low" ? "Low stock" : undefined}>
                <input
                  type="radio"
                  name={`size-${product.slug}`}
                  value={s}
                  checked={size === s}
                  disabled={level === "out"}
                  onChange={() => setSize(s)}
                />
                <span aria-hidden="true">{s}</span>
                <span className="visually-hidden">{level === "out" ? `${s}, sold out` : level === "low" ? `${s}, low stock` : s}</span>
              </label>
            );
          })}
        </fieldset>

        <p className={styles.stockNote} aria-live="polite">
          {size && stockLevel(product, size) === "low" ? `Only ${product.stock[size]} left in ${size}` : " "}
        </p>

        <Button className={styles.cta} disabled={!size || soldOut || maxed} onClick={addToBag}>
          {soldOut ? "Sold out" : !size ? "Select a size" : maxed ? "Max quantity in bag" : "Add to bag"}
        </Button>

        <button type="button" className={styles.availability} onClick={() => setAvailabilityOpen(true)}>
          See availability
        </button>

        <details className={styles.details}>
          <summary>Details</summary>
          <p>{product.description}</p>
          <ul>
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
      </div>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby={`${headingId}-related`}>
          <h3 id={`${headingId}-related`} className={styles.relatedTitle}>
            Complete the look
          </h3>
          <ul className={styles.relatedList}>
            {related.map((r) => (
              <li key={r.slug}>
                <a
                  href={productHref(r.slug)}
                  className={styles.relatedCard}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    onOpenRelated(r.slug);
                  }}
                >
                  <span className={styles.relatedArt}>
                    <GarmentArt art={r.art} uid={`rel-${product.slug}-${r.slug}`} />
                  </span>
                  <span className={styles.relatedName}>{r.name}</span>
                  <span className={styles.relatedMeta}>
                    {r.colorName} · {formatEur(r.priceEur)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AvailabilityDialog
        product={product}
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
        onPickSize={(s) => {
          setSize(s);
          setAvailabilityOpen(false);
        }}
      />
    </article>
  );
}
