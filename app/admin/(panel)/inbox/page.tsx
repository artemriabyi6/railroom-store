import type { Metadata } from "next";
import styles from "@/features/admin/Admin.module.scss";
import { listMessages } from "@/services/messages/store";

export const metadata: Metadata = { title: "Inbox" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminInboxPage() {
  const [messages, subscribers] = await Promise.all([listMessages("contact"), listMessages("newsletter")]);
  return (
    <section aria-labelledby="inbox-title">
      <div className={styles.pageHead}>
        <div>
          <h1 id="inbox-title" className={styles.pageTitle}>
            Inbox
          </h1>
          <p className={styles.muted}>
            {messages.length} contact messages · {subscribers.length} newsletter subscribers
          </p>
        </div>
      </div>

      <div className={styles.inboxGrid}>
        <div>
          <h2 className={styles.cardTitle}>Contact messages</h2>
          {messages.length === 0 ? (
            <p className={styles.empty}>No messages yet.</p>
          ) : (
            <ul className={styles.messages}>
              {messages.map((m) => (
                <li key={m.id} className={styles.message}>
                  <p className={styles.messageHead}>
                    <strong>{String(m.payload.name ?? "")}</strong>
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                    <span className={styles.muted}>{fmt.format(new Date(m.createdAt))}</span>
                  </p>
                  <p className={styles.messageBody}>{String(m.payload.message ?? "")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className={styles.cardTitle}>Newsletter subscribers</h2>
          {subscribers.length === 0 ? (
            <p className={styles.empty}>No subscribers yet.</p>
          ) : (
            <ul className={styles.subscribers}>
              {subscribers.map((s) => (
                <li key={s.id}>
                  <span>{s.email}</span>
                  <span className={styles.muted}>{fmt.format(new Date(s.createdAt))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
