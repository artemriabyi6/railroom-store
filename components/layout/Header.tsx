import Link from "next/link";
import { siteConfig } from "@/config/site";
import { HeaderActions } from "./HeaderActions";
import styles from "./Header.module.scss";
import { MobileMenu } from "./MobileMenu";

export const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?sort=new", label: "New in" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.left} aria-label="Primary">
        <MobileMenu />
        <ul className={styles.navList}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={styles.navLink}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link href="/" className={styles.logo} aria-label={`${siteConfig.name} — home`}>
        {siteConfig.name}
      </Link>
      <HeaderActions />
    </header>
  );
}
