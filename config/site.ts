import type { CurrencyCode } from "@/types/commerce";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  // Vercel exposes the production domain at build and run time.
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "RAILROOM",
  tagline: "Official Clothing",
  description:
    "Independent clothing label. Shirts, outerwear and heavyweight basics, cut in small runs and sold straight off the rail.",
  url: siteUrl,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
} as const;

export interface CurrencyDefinition {
  code: CurrencyCode;
  label: string;
  locale: string;
  /** Units of this currency per 1 EUR. Update to match your pricing policy. */
  rate: number;
}

export const currencies: Record<CurrencyCode, CurrencyDefinition> = {
  EUR: { code: "EUR", label: "Euro", locale: "en-IE", rate: 1 },
  USD: { code: "USD", label: "US Dollar", locale: "en-US", rate: 1.08 },
  GBP: { code: "GBP", label: "British Pound", locale: "en-GB", rate: 0.85 },
  NGN: { code: "NGN", label: "Nigerian Naira", locale: "en-NG", rate: 1650 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export const shippingPolicy = {
  /** Flat shipping in euro cents. */
  flatEur: 1200,
  /** Orders at or above this subtotal (euro cents) ship free. */
  freeFromEur: 20000,
  maxQuantityPerLine: 5,
} as const;

export const shippingCountries = [
  "Austria",
  "Belgium",
  "Denmark",
  "Finland",
  "France",
  "Germany",
  "Ireland",
  "Italy",
  "Netherlands",
  "Nigeria",
  "Norway",
  "Poland",
  "Portugal",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Kingdom",
  "United States",
] as const;
