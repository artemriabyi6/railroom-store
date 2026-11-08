"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { categoryLabels, CATEGORIES, categoryProducts } from "@/lib/catalog";
import styles from "./MobileMenu.module.scss";

const SECONDARY = [
  { href: "/about", label: "About" },
  { href: "/shipping", label: "Shipping & Returns" },
  { href: "/account", label: "Track order" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const catalog = useCatalog();

  // Close after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Menu" variant="drawerLeft">
        <nav aria-label="Mobile">
          <ul className={styles.primary}>
            <li>
              <Link href="/shop" onClick={() => setOpen(false)}>
                Shop all
              </Link>
            </li>
            <li>
              <Link href="/shop?sort=new" onClick={() => setOpen(false)}>
                New in
              </Link>
            </li>
          </ul>
          <p className={styles.label}>Categories</p>
          <ul className={styles.categories}>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/shop?category=${c}`} onClick={() => setOpen(false)}>
                  {categoryLabels[c]}
                  <span>{categoryProducts(catalog, c).length}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className={styles.secondary}>
            {SECONDARY.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Dialog>
    </>
  );
}
