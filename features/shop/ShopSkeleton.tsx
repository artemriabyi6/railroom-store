import styles from "./ShopSkeleton.module.scss";

/** Static loading shell for the catalogue while URL filters resolve on the client. */
export function ShopSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.wrap} role="status" aria-label="Loading catalogue">
      <div className={styles.head}>
        <span className={styles.line} style={{ width: 80 }} />
        <span className={styles.title} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={styles.card} />
        ))}
      </div>
    </div>
  );
}
