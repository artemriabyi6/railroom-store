"use client";

import { GarmentArt } from "@/components/garment/GarmentArt";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { shippingPolicy } from "@/config/site";
import { useCurrency } from "@/features/currency/currencyStore";
import { canAddMore } from "@/lib/cart";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { findProduct } from "@/lib/catalog";
import { priceCart } from "@/lib/pricing";
import styles from "./CartDrawer.module.scss";
import { cartActions, useCart, useCartOpen } from "./cartStore";

export function CartDrawer() {
  const open = useCartOpen();
  const { lines, count } = useCart();
  const { currency, formatEur, formatMinor } = useCurrency();
  const catalog = useCatalog();
  const priced = priceCart(catalog, lines, currency);
  const subtotalEur = lines.reduce((sum, l) => sum + (findProduct(catalog, l.slug)?.priceEur ?? 0) * l.quantity, 0);
  const remainingForFree = Math.max(0, shippingPolicy.freeFromEur - subtotalEur);

  return (
    <Dialog
      open={open}
      onClose={cartActions.close}
      title={count ? `Your bag (${count})` : "Your bag"}
      variant="drawer"
      footer={
        lines.length > 0 && priced.ok ? (
          <div className={styles.summary}>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMinor(priced.priced.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{priced.priced.shipping === 0 ? "Free" : formatMinor(priced.priced.shipping)}</dd>
              </div>
              <div className={styles.total}>
                <dt>Total</dt>
                <dd>{formatMinor(priced.priced.total)}</dd>
              </div>
            </dl>
            <ButtonLink href="/checkout" block size="lg" onClick={cartActions.close}>
              Checkout
            </ButtonLink>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Your bag is empty</p>
          <p>Pick something off the rail to get started.</p>
          <Button variant="outline" onClick={cartActions.close}>
            Continue browsing
          </Button>
        </div>
      ) : (
        <>
          <p className={styles.shippingNote}>
            {remainingForFree > 0 ? <>Spend {formatEur(remainingForFree)} more for free shipping.</> : <>Your order ships free.</>}
          </p>
          <ul className={styles.lines}>
            {lines.map((line) => {
              const product = findProduct(catalog, line.slug);
              if (!product) return null;
              return (
                <li key={`${line.slug}-${line.size}`} className={styles.line}>
                  <span className={styles.thumb}>
                    <GarmentArt art={product.art} uid={`bag-${line.slug}-${line.size}`} showHanger={false} />
                  </span>
                  <div className={styles.info}>
                    <p className={styles.name}>{product.name}</p>
                    <p className={styles.sub}>
                      {product.colorName} · Size {line.size}
                    </p>
                    <div className={styles.row}>
                      <div className={styles.stepper} role="group" aria-label={`Quantity for ${product.name}, size ${line.size}`}>
                        <button
                          type="button"
                          onClick={() => cartActions.setQuantity(catalog, line.slug, line.size, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <output aria-live="polite">{line.quantity}</output>
                        <button
                          type="button"
                          onClick={() => cartActions.setQuantity(catalog, line.slug, line.size, line.quantity + 1)}
                          disabled={!canAddMore(catalog, lines, line.slug, line.size)}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <button type="button" className={styles.remove} onClick={() => cartActions.remove(line.slug, line.size)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className={styles.price}>{formatEur(product.priceEur * line.quantity)}</p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Dialog>
  );
}
