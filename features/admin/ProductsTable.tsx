"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { ButtonLink } from "@/components/ui/Button";
import { toast } from "@/components/ui/toastStore";
import { categoryLabels, CATEGORIES, searchProducts, totalStock } from "@/lib/catalog";
import { formatMinor } from "@/lib/currency";
import type { Product, ProductCategory } from "@/types/product";
import { SIZES } from "@/types/product";
import { deleteProductAction, moveProductAction } from "./actions";
import styles from "./Admin.module.scss";

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const saved = params.get("saved");
  const deleted = params.get("deleted");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => searchProducts(products, { text: query, category }), [products, query, category]);
  const reorderable = !query && category === "all";

  const remove = (p: Product) => {
    if (!window.confirm(`Delete “${p.name} — ${p.colorName}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteProductAction(p.slug);
      if (res.ok) {
        toast(`Deleted ${p.name}`, "success");
        router.refresh();
      } else toast(res.message ?? "Could not delete.", "error");
    });
  };

  const move = (slug: string, dir: -1 | 1) =>
    startTransition(async () => {
      await moveProductAction(slug, dir);
      router.refresh();
    });

  return (
    <section aria-labelledby="products-title">
      <div className={styles.pageHead}>
        <div>
          <h1 id="products-title" className={styles.pageTitle}>
            Products
          </h1>
          <p className={styles.muted}>
            {products.length} products · {products.filter((p) => p.rail).length} on the homepage rail · {products.filter((p) => p.isNew).length} marked new
          </p>
        </div>
        <ButtonLink href="/admin/products/new">+ New product</ButtonLink>
      </div>

      {deleted && (
        <p className={styles.flash} role="status">
          Deleted <strong>{deleted}</strong>. It disappears from the store within a few seconds.
        </p>
      )}

      {saved && (
        <p className={styles.flash} role="status">
          Saved <strong>{saved}</strong>. The storefront refreshes within a few seconds.
        </p>
      )}

      <div className={styles.filters}>
        <input type="search" className={styles.input} placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
        <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | "all")} aria-label="Category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap} aria-busy={pending}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.thumbCol}>
                <span className="visually-hidden">Image</span>
              </th>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Stock</th>
              <th scope="col">Flags</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const total = totalStock(p);
              return (
                <tr key={p.slug}>
                  <td>
                    <span className={styles.thumb}>
                      <GarmentArt art={p.art} uid={`adm-${p.slug}`} showHanger={false} />
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.slug}`} className={styles.rowTitle}>
                      {p.name}
                    </Link>
                    <span className={styles.muted}>
                      {p.colorName} · /{p.slug}
                    </span>
                  </td>
                  <td>{categoryLabels[p.category]}</td>
                  <td>{formatMinor(p.priceEur, "EUR")}</td>
                  <td>
                    <span className={styles.stockTotal} data-level={total === 0 ? "out" : total <= 10 ? "low" : "in"}>
                      {total}
                    </span>
                    <span className={styles.stockSizes}>{SIZES.map((s) => `${s}:${p.stock[s] ?? 0}`).join(" ")}</span>
                  </td>
                  <td>
                    <span className={styles.flags}>
                      {p.rail && <span className={styles.flag}>Rail</span>}
                      {p.isNew && <span className={styles.flagNew}>New</span>}
                    </span>
                  </td>
                  <td className={styles.rowActions}>
                    {reorderable && (
                      <>
                        <button type="button" className={styles.iconAction} onClick={() => move(p.slug, -1)} disabled={pending || i === 0} aria-label={`Move ${p.name} up`}>
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.iconAction}
                          onClick={() => move(p.slug, 1)}
                          disabled={pending || i === filtered.length - 1}
                          aria-label={`Move ${p.name} down`}
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <Link href={`/admin/products/${p.slug}`} className={styles.textAction}>
                      Edit
                    </Link>
                    <button type="button" className={styles.dangerAction} onClick={() => remove(p)} disabled={pending}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className={styles.empty}>No products match.</p>}
      </div>
    </section>
  );
}
