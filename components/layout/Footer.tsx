import Link from "next/link";
import { siteConfig } from "@/config/site";
import { categoryLabels, CATEGORIES } from "@/lib/catalog";
import styles from "./Footer.module.scss";

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "Shop all" },
      { href: "/shop?sort=new", label: "New in" },
      ...CATEGORIES.map((c) => ({ href: `/shop?category=${c}`, label: categoryLabels[c] })),
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping", label: "Shipping & Returns" },
      { href: "/account", label: "Track order" },
    ],
  },
  {
    title: siteConfig.name,
    links: [
      { href: "/about", label: "About" },
      ...(siteConfig.instagram ? [{ href: siteConfig.instagram, label: "Instagram", external: true }] : []),
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            {siteConfig.name}
          </Link>
          <p className={styles.tagline}>{siteConfig.description}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className={styles.col}>
            <p className={styles.colTitle}>{col.title}</p>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={styles.bottom}>
        <p>
          © {siteConfig.name} {siteConfig.tagline}
        </p>
        <p>Prices include VAT where applicable</p>
      </div>
    </footer>
  );
}
