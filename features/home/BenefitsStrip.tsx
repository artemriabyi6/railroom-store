import { shippingPolicy } from "@/config/site";
import { formatMinor } from "@/lib/currency";
import styles from "./BenefitsStrip.module.scss";

const ICONS = {
  truck: (
    <>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </>
  ),
  return: (
    <>
      <path d="M9 7 5 11l4 4" />
      <path d="M5 11h9a5 5 0 0 1 0 10h-3" />
    </>
  ),
  needle: (
    <>
      <path d="M4 20 18 6" />
      <circle cx="19" cy="5" r="1.6" />
      <path d="M7 13c-3 0-4 2-3 4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
};

const ITEMS = [
  { icon: ICONS.truck, title: `Free shipping over ${formatMinor(shippingPolicy.freeFromEur, "EUR").replace(/\.00$/, "")}`, text: "EU delivery in 2–5 working days" },
  { icon: ICONS.return, title: "14-day returns", text: "Unworn, with tags, no questions asked" },
  { icon: ICONS.needle, title: "Made in small runs", text: "Most styles are never restocked" },
  { icon: ICONS.lock, title: "Secure checkout", text: "Card payments via LiqPay" },
];

export function BenefitsStrip() {
  return (
    <section className={styles.strip} aria-label="Why shop with us">
      <ul className={styles.list}>
        {ITEMS.map((item) => (
          <li key={item.title} className={styles.item}>
            <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" focusable="false">
              {item.icon}
            </svg>
            <span className={styles.copy}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.text}>{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
