"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { postJson } from "@/lib/api";
import { isEmail } from "@/lib/validation";
import styles from "./Newsletter.module.scss";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const id = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email.trim().toLowerCase())) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    setStatus({ kind: "sending" });
    const res = await postJson("/api/newsletter", { email, company });
    if (res.ok) setStatus({ kind: "done" });
    else setStatus({ kind: "error", message: res.status === 0 ? "You appear to be offline." : String(res.data.error ?? "Something went wrong.") });
  };

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Newsletter</p>
        <h2 id={`${id}-title`} className={styles.title}>
          First pick of the next drop
        </h2>
        <p className={styles.text}>One email per drop, 48 hours before it goes public. No spam, and you can unsubscribe in one click.</p>

        {status.kind === "done" ? (
          <p className={styles.done} role="status">
            <span className={styles.check}>
              <CheckIcon size={16} />
            </span>
            You&apos;re on the list. See you at the next drop.
          </p>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            <label htmlFor={`${id}-email`} className="visually-hidden">
              Email address
            </label>
            <input
              id={`${id}-email`}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status.kind === "error") setStatus({ kind: "idle" });
              }}
              aria-invalid={status.kind === "error" || undefined}
              aria-describedby={status.kind === "error" ? `${id}-err` : undefined}
              className={styles.input}
            />
            <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} className={styles.honeypot} aria-hidden="true" />
            <Button type="submit" size="lg" loading={status.kind === "sending"}>
              {status.kind === "sending" ? "Joining…" : "Join the list"}
            </Button>
          </form>
        )}
        {status.kind === "error" && (
          <p id={`${id}-err`} className={styles.error} role="alert">
            {status.message}
          </p>
        )}
      </div>
    </section>
  );
}
