import type { ReactNode } from "react";
import styles from "./ContentPage.module.scss";

/** Shared shell for editorial pages (About, Shipping, Checkout, Account). */
export function ContentPage({ eyebrow, title, intro, children, wide }: { eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={styles.page} data-wide={wide ? "" : undefined}>
      <header className={styles.head}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {intro && <div className={styles.intro}>{intro}</div>}
      </header>
      {children}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}
