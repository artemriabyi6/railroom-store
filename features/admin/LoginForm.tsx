"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { login, type LoginState } from "./actions";
import styles from "./Admin.module.scss";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={styles.loginForm}>
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required autoFocus error={state.error} />
      <Button type="submit" block size="lg" loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
