"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { Dialog } from "@/components/ui/Dialog";
import { SearchIcon } from "@/components/ui/icons";
import { useCurrency } from "@/features/currency/currencyStore";
import { productHref, selectProduct, slugFromPath } from "@/features/rack/navigation";
import { CATEGORIES as PRODUCT_CATEGORIES, categoryLabels, searchProducts, SORT_OPTIONS, totalStock, type SortKey } from "@/lib/catalog";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import styles from "./SearchDialog.module.scss";

const CATEGORIES = ["all", ...PRODUCT_CATEGORIES] as const;
const SORTS = SORT_OPTIONS;

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const deferredText = useDeferredValue(text);
  const catalog = useCatalog();
  const results = useMemo(() => searchProducts(catalog, { text: deferredText, category, sort }), [catalog, deferredText, category, sort]);
  const { formatEur } = useCurrency();
  const pathname = usePathname();
  const router = useRouter();

  const choose = (slug: string) => {
    onClose();
    const onRack = pathname === "/" || slugFromPath(pathname) !== null;
    if (onRack) selectProduct(slug);
    else router.push(productHref(slug));
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search" variant="top">
      <form
        role="search"
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) choose(results[0].slug);
        }}
      >
        <label className={styles.field}>
          <SearchIcon size={18} />
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search shirts, hoodies, colours…"
            data-autofocus
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <div className={styles.controls}>
          <div className={styles.chips} role="group" aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={category === c} className={styles.chip} onClick={() => setCategory(c)}>
                {c === "all" ? "All" : categoryLabels[c]}
              </button>
            ))}
          </div>
          <label className={styles.sort}>
            <span className="visually-hidden">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <p className={styles.count} aria-live="polite">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>

      {results.length === 0 ? (
        <div className={styles.empty}>
          <p>Nothing on the rail matches “{deferredText}”.</p>
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setText("");
              setCategory("all");
            }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className={styles.results}>
          {results.map((p) => (
            <li key={p.slug}>
              <a
                href={productHref(p.slug)}
                className={styles.result}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  choose(p.slug);
                }}
              >
                <span className={styles.thumb}>
                  <GarmentArt art={p.art} uid={`search-${p.slug}`} showHanger={false} />
                </span>
                <span className={styles.meta}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.sub}>
                    {p.colorName} · {categoryLabels[p.category]}
                    {totalStock(p) === 0 && " · Sold out"}
                  </span>
                </span>
                <span className={styles.price}>{formatEur(p.priceEur)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
