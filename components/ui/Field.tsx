import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import styles from "./Field.module.scss";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

function Shell({ id, label, error, hint, className, required, children }: BaseProps & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {!required && <span className={styles.optional}> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-err` : hint ? `${id}-hint` : undefined;
}

export function TextField({ label, error, hint, className, ...input }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} className={className} required={input.required}>
      <input id={id} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
    </Shell>
  );
}

export function TextAreaField({ label, error, hint, className, ...input }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} className={className} required={input.required}>
      <textarea id={id} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
    </Shell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...input
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} className={className} required={input.required}>
      <select id={id} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input}>
        {children}
      </select>
    </Shell>
  );
}
