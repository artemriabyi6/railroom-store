import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import styles from "./Button.module.scss";
import { Spinner } from "./Spinner";

type Variant = "solid" | "outline" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [styles.button, styles[variant], styles[size], block && styles.block, extra].filter(Boolean).join(" ");
}

export function Button({
  variant = "solid",
  size = "md",
  block,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={classes(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      <span>{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  size = "md",
  block,
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, size, block, className)} {...rest}>
      <span>{children}</span>
    </Link>
  );
}
