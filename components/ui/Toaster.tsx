"use client";

import { CloseIcon } from "./icons";
import styles from "./Toaster.module.scss";
import { dismissToast, useToasts } from "./toastStore";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast} data-tone={t.tone}>
          <span>{t.message}</span>
          <button type="button" className={styles.close} onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
