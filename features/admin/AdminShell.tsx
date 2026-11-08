"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { logout } from "./actions";
import styles from "./Admin.module.scss";

const NAV = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inbox", label: "Inbox" },
];

const STORAGE_LABEL = {
  database: { text: "Postgres database", tone: "ok" },
  files: { text: "Local JSON files (development)", tone: "info" },
  ephemeral: { text: "No database: changes are temporary", tone: "warn" },
} as const;

export function AdminShell({ storage, children }: { storage: keyof typeof STORAGE_LABEL; children: ReactNode }) {
  const pathname = usePathname();
  const badge = STORAGE_LABEL[storage];
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/admin/products" className={styles.brand}>
          {siteConfig.name} <span>/ Admin</span>
        </Link>
        <nav aria-label="Admin" className={styles.nav}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.navLink} aria-current={pathname.startsWith(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className={styles.topActions}>
          <span className={styles.storage} data-tone={badge.tone} title="Where catalogue and orders are stored">
            {badge.text}
          </span>
          <a href="/" className={styles.navLink} target="_blank" rel="noopener">
            View store ↗
          </a>
          <form action={logout}>
            <button type="submit" className={styles.navLink}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
