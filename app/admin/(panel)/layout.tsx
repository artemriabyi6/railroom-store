import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { AdminShell } from "@/features/admin/AdminShell";
import styles from "@/features/admin/Admin.module.scss";
import { requireAdmin } from "@/services/auth/adminSession";
import { hasDatabase } from "@/services/db/client";

/**
 * Everything under /admin except /admin/login. The session cookie is checked here and
 * again inside every server action. Reading cookies is request-time work, so it sits
 * inside Suspense.
 */
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <Spinner size={24} label="Loading admin" />
        </div>
      }
    >
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const storage = hasDatabase() ? "database" : process.env.VERCEL ? "ephemeral" : "files";
  return <AdminShell storage={storage}>{children}</AdminShell>;
}
