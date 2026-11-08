import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import styles from "@/features/admin/Admin.module.scss";
import { LoginForm } from "@/features/admin/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <p className={styles.brand}>{siteConfig.name}</p>
        <h1 className={styles.loginTitle}>Admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
