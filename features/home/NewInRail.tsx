"use client";

import { useId } from "react";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { openProductOnHome } from "@/features/rack/navigation";
import { RailList } from "@/features/rack/RailList";
import type { Product } from "@/types/product";
import styles from "./HomeSection.module.scss";

export function NewInRail({ products }: { products: readonly Product[] }) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <SectionHeading
        id={titleId}
        eyebrow={`Drop 03 · ${products.length} new pieces`}
        title="New in"
        intro="Fresh off the cutting table. Run your cursor along the rail to turn each piece around."
        action={{ href: "/shop?sort=new", label: "Shop new in" }}
      />
      <RailList products={products} label="New arrivals" variant="strip" idPrefix="newin" onOpen={({ product }) => openProductOnHome(product.slug)} />
    </section>
  );
}
