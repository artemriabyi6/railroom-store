import type { Metadata } from "next";
import styles from "@/features/admin/Admin.module.scss";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className={styles.root}>{children}</div>;
}
