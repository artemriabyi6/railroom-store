"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { GarmentArt, type GarmentView } from "@/components/garment/GarmentArt";
import { Button } from "@/components/ui/Button";
import { useCurrency } from "@/features/currency/currencyStore";
import { openProductOnHome } from "@/features/rack/navigation";
import type { Product } from "@/types/product";
import styles from "./FeaturedDrop.module.scss";

const FACTS = ["Cotton flannel body", "Hand-finished piping", "Run of 120 per colourway"];

export function FeaturedDrop({ colourways }: { colourways: readonly Product[] }) {
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<GarmentView>("front");
  const { formatEur } = useCurrency();
  const product = colourways[index];
  if (!product) return null;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <div className={styles.visual} onMouseEnter={() => setView("back")} onMouseLeave={() => setView("front")}>
          <span className={styles.rail} aria-hidden="true" />
          <div className={styles.garment}>
            <div key={product.slug} className={styles.turn} data-view={view}>
              {(["front", "back"] as const).map((side) => (
                <GarmentArt
                  key={side}
                  art={product.art}
                  view={side}
                  uid={`drop-${product.slug}-${side}`}
                  label={side === view ? `${product.name}, ${side} view` : undefined}
                  className={`${styles.face} ${side === "back" ? styles.backFace : ""}`}
                />
              ))}
            </div>
          </div>
          <p className={styles.hint} aria-hidden="true">
            Hover to see the back
          </p>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Drop 03 — The Split</p>
          <h2 id={titleId} className={styles.title}>
            Cut through
            <br />
            the check
          </h2>
          <p className={styles.text}>
            Our signature shirt. Each piece starts as a flannel check, gets cut through with a single flowing poplin panel, and is finished with contrast
            piping sewn by hand. Two colourways, made in small runs.
          </p>
          <ul className={styles.facts}>
            {FACTS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          <fieldset className={styles.swatches}>
            <legend className={styles.swatchLegend}>
              Colourway: <strong>{product.colorName}</strong>
            </legend>
            {colourways.map((c, i) => {
              const accent = c.art.panels?.[0]?.fill ?? c.art.base;
              return (
                <label key={c.slug} className={styles.swatch} style={{ background: `linear-gradient(135deg, ${c.art.base} 50%, ${accent} 50%)` }}>
                  <input type="radio" name="drop-colourway" checked={i === index} onChange={() => setIndex(i)} />
                  <span className="visually-hidden">{c.colorName}</span>
                </label>
              );
            })}
          </fieldset>

          <div className={styles.actions}>
            <Button size="lg" onClick={() => openProductOnHome(product.slug)}>
              Shop the shirt · {formatEur(product.priceEur)}
            </Button>
            <Link href="/shop?category=shirts" className={styles.secondary}>
              All shirts
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
