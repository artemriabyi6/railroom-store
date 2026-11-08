import Link from "next/link";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CATEGORIES, categoryLabels, categoryProducts, type Catalog } from "@/lib/catalog";
import styles from "./CategoryTiles.module.scss";
import section from "./HomeSection.module.scss";

export function CategoryTiles({ catalog }: { catalog: Catalog }) {
  return (
    <section className={section.section} aria-label="Shop by category">
      <SectionHeading eyebrow="Browse" title="Shop by category" action={{ href: "/shop", label: "View the full catalogue" }} />
      <ul className={styles.grid}>
        {CATEGORIES.map((category) => {
          const items = categoryProducts(catalog, category);
          if (items.length === 0) return null;
          const shown = items.slice(0, 3);
          return (
            <li key={category}>
              <Link href={`/shop?category=${category}`} className={styles.tile}>
                <span className={styles.stage} aria-hidden="true">
                  <span className={styles.rail} />
                  {shown.map((p, i) => (
                    <span key={p.slug} className={styles.hanger} style={{ ["--i" as string]: i - (shown.length - 1) / 2 }}>
                      <GarmentArt art={p.art} uid={`cat-${category}-${p.slug}`} className={styles.art} />
                    </span>
                  ))}
                </span>
                <span className={styles.label}>
                  <span className={styles.name}>{categoryLabels[category]}</span>
                  <span className={styles.count}>
                    {items.length} pieces <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
