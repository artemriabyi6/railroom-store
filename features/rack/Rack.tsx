"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import type { Product } from "@/types/product";
import { clearReturnPath, productHref, selectProduct, slugFromPath, takeReturnPath } from "./navigation";
import { ProductPanel, type PanelOrigin } from "./ProductPanel";
import styles from "./Rack.module.scss";
import { RailList, type RailOpenEvent } from "./RailList";

interface RackProps {
  /** Garments that hang on the hero rail. */
  railProducts: readonly Product[];
  /** Every product that can be opened in the panel (the full catalogue). */
  products: readonly Product[];
}

export function Rack({ railProducts, products }: RackProps) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedSlug = slugFromPath(pathname);
  const selected = products.find((p) => p.slug === selectedSlug) ?? null;
  const [origin, setOrigin] = useState<(PanelOrigin & { slug: string }) | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOrigin(null);
    // Products opened from the catalogue return there; otherwise back to the rail.
    const back = takeReturnPath();
    if (back) router.push(back, { scroll: false });
    else selectProduct(null);
  }, [router]);

  // Keep the document title in sync with client-side selection.
  useEffect(() => {
    document.title = selected ? `${selected.name} — ${selected.colorName} | ${siteConfig.name}` : `${siteConfig.name} | ${siteConfig.tagline}`;
  }, [selected]);

  // Return focus to the garment that opened the panel.
  const lastOpened = useRef<string | null>(null);
  useEffect(() => {
    if (selected) {
      lastOpened.current = selected.slug;
    } else if (lastOpened.current) {
      listRef.current?.querySelector<HTMLAnchorElement>(`a[data-slug="${lastOpened.current}"]`)?.focus({ preventScroll: true });
      lastOpened.current = null;
    }
  }, [selected]);

  const open = ({ product, rect, rotated }: RailOpenEvent) => {
    clearReturnPath();
    setOrigin({ slug: product.slug, rect, rotated });
    selectProduct(product.slug);
  };

  return (
    <section className={styles.stage} data-selected={selected ? "" : undefined} aria-label="Shop the rail">
      <h1 className="visually-hidden">{selected ? `${selected.name} — ${selected.colorName}` : `${siteConfig.name} — ${siteConfig.tagline}`}</h1>

      <div className={styles.rack} inert={selected ? true : undefined}>
        <RailList products={railProducts} label="Garments on the rail" onOpen={open} hiddenSlug={selected?.slug} idPrefix="rack" listRef={listRef} />
      </div>

      {selected && (
        <>
          <div className={styles.backdrop} onClick={close} aria-hidden="true" />
          <ProductPanel
            key={selected.slug}
            product={selected}
            origin={origin?.slug === selected.slug ? origin : null}
            onClose={close}
            onOpenRelated={(slug) => {
              setOrigin(null);
              if (window.location.pathname !== productHref(slug)) selectProduct(slug);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </section>
  );
}
