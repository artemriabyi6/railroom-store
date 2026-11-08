"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";
import { postJson } from "@/lib/api";
import { validateContact, type ContactField } from "@/lib/validation";
import type { FieldErrors } from "@/types/commerce";
import styles from "./ContactForm.module.scss";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "", company: "" });
  const [errors, setErrors] = useState<FieldErrors<ContactField>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const update = (key: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (key in errors) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const check = validateContact(values);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setStatus({ kind: "sending" });
    const res = await postJson("/api/contact", values);
    if (res.ok) {
      setStatus({ kind: "sent" });
      return;
    }
    if (res.data.fields) setErrors(res.data.fields as FieldErrors<ContactField>);
    setStatus({ kind: "error", message: String(res.data.error ?? "Something went wrong. Please try again.") });
  };

  if (status.kind === "sent") {
    return (
      <div className={styles.sent} role="status">
        <span className={styles.check}>
          <CheckIcon size={20} />
        </span>
        <p className={styles.sentTitle}>Message sent</p>
        <p>Thanks, {values.name.split(" ")[0]}. We&apos;ll get back to you at {values.email}.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setValues({ name: "", email: "", message: "", company: "" });
            setStatus({ kind: "idle" });
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField label="Name" name="name" autoComplete="name" required value={values.name} onChange={update("name")} error={errors.name} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />
      <TextAreaField label="Message" name="message" required rows={4} value={values.message} onChange={update("message")} error={errors.message} />
      <div className={styles.honeypot} aria-hidden="true">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" name="company" value={values.company} onChange={update("company")} />
        </label>
      </div>
      {status.kind === "error" && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}
      <Button type="submit" block loading={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
