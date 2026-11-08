"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { categoryLabels, CATEGORIES, isCategory, isSize, isSortKey, searchProducts, SORT_OPTIONS, type SortKey } from "@/lib/catalog";
import { SIZES, type ProductCategory, type Size } from "@/types/product";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { ProductCard } from "./ProductCard";
import styles from "./ShopCatalog.module.scss";

const PAGE_SIZE = 12;

interface Filters {
  category: ProductCategory | "all";
  size: Size | null;
  sort: SortKey;
  q: string;
  inStock: boolean;
}

function readFilters(params: URLSearchParams): Filters {
  const category = params.get("category");
  const size = params.get("size");
  const sort = params.get("sort");
  return {
    category: isCategory(category) ? category : "all",
    size: isSize(size) ? size : null,
    sort: isSortKey(sort) ? sort : "featured",
    q: params.get("q")?.slice(0, 80) ?? "",
    inStock: params.get("instock") === "1",
  };
}

function toQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.category !== "all") p.set("category", f.category);
  if (f.size) p.set("size", f.size);
  if (f.sort !== "featured") p.set("sort", f.sort);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.inStock) p.set("instock", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function ShopCatalog() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = readFilters(params);
  const [text, setText] = useState(filters.q);
  const deferredText = useDeferredValue(text);
  const queryKey = toQuery({ ...filters, q: deferredText });
  const [visible, setVisible] = useState({ key: queryKey, count: PAGE_SIZE });
  const count = visible.key === queryKey ? visible.count : PAGE_SIZE;

  const all = useCatalog();
  const results = useMemo(
    () => searchProducts(all, { text: deferredText, category: filters.category, size: filters.size, inStockOnly: filters.inStock, sort: filters.sort }),
    [all, deferredText, filters.category, filters.size, filters.inStock, filters.sort],
  );
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const p of searchProducts(all, { text: deferredText, size: filters.size, inStockOnly: filters.inStock })) {
      counts.all += 1;
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [all, deferredText, filters.size, filters.inStock]);

  const update = (patch: Partial<Filters>) => {
    router.replace(`${pathname}${toQuery({ ...filters, q: text, ...patch })}`, { scroll: false });
  };

  // Keep the search text in the URL (debounced through useDeferredValue).
  useEffect(() => {
    if (deferredText.trim() === filters.q.trim()) return;
    const t = window.setTimeout(() => router.replace(`${pathname}${toQuery({ ...filters, q: deferredText })}`, { scroll: false }), 300);
    return () => window.clearTimeout(t);
  }, [deferredText, filters, pathname, router]);

  const hasFilters = filters.category !== "all" || filters.size || filters.inStock || text.trim();
  const shown = results.slice(0, count);
  const title = filters.category === "all" ? (filters.sort === "new" ? "New in" : "Shop all") : categoryLabels[filters.category];

  return (
    <div className={styles.shop}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Catalogue</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.count} aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.chips} role="group" aria-label="Category">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className={styles.chip} aria-pressed={filters.category === c} onClick={() => update({ category: c })}>
              {c === "all" ? "All" : categoryLabels[c]}
              <span className={styles.chipCount}>{categoryCounts[c] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <label className={styles.search}>
            <SearchIcon size={16} />
            <span className="visually-hidden">Search the catalogue</span>
            <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search" autoComplete="off" enterKeyHint="search" />
          </label>
          <label className={styles.select}>
            <span className="visually-hidden">Sort by</span>
            <select value={filters.sort} onChange={(e) => update({ sort: isSortKey(e.target.value) ? e.target.value : "featured" })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.secondary}>
          <div className={styles.sizes} role="group" aria-label="Size in stock">
            <span className={styles.groupLabel} aria-hidden="true">
              Size
            </span>
            {SIZES.map((s) => (
              <button key={s} type="button" className={styles.sizeChip} aria-pressed={filters.size === s} onClick={() => update({ size: filters.size === s ? null : s })}>
                {s}
              </button>
            ))}
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={filters.inStock} onChange={(e) => update({ inStock: e.target.checked })} />
            <span className={styles.switch} aria-hidden="true" />
            In stock only
          </label>
          {hasFilters && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                setText("");
                router.replace(pathname + (filters.sort !== "featured" ? `?sort=${filters.sort}` : ""), { scroll: false });
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nothing on the rail matches</p>
          <p>Try another size or category, or clear your filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setText("");
              router.replace(pathname, { scroll: false });
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <ul className={styles.grid}>
            {shown.map((p, i) => (
              <li key={p.slug}>
                <ProductCard product={p} priority={i < 8} />
              </li>
            ))}
          </ul>
          <div className={styles.more}>
            <p className={styles.progress}>
              Showing {shown.length} of {results.length}
            </p>
            <span className={styles.bar} aria-hidden="true">
              <span style={{ width: `${(shown.length / results.length) * 100}%` }} />
            </span>
            {shown.length < results.length && (
              <Button variant="outline" onClick={() => setVisible({ key: queryKey, count: count + PAGE_SIZE })}>
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
