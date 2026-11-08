import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./SectionHeading.module.scss";

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  action?: { href: string; label: string };
  align?: "center" | "split";
}

/** Eyebrow + wide display title, matching the wordmark and product names. */
export function SectionHeading({ id, eyebrow, title, intro, action, align = "center" }: SectionHeadingProps) {
  return (
    <header className={styles.head} data-align={align}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {intro && <p className={styles.intro}>{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label}
          <span aria-hidden="true"> →</span>
        </Link>
      )}
    </header>
  );
}
