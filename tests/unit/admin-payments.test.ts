import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@/data/products";
import { slugify, validateProduct } from "@/lib/productValidation";
import type { Order } from "@/types/commerce";

// next/headers and next/navigation are only used by request-time helpers we don't call here.
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("product validation (admin)", () => {
  const valid = { ...products[0], priceEur: 24000 };

  it("accepts every seed product", () => {
    for (const p of products) expect(validateProduct(p).ok, p.slug).toBe(true);
  });

  it("derives a slug from the name when none is given", () => {
    const result = validateProduct({ ...valid, slug: "", name: "Sunday Best Shirt!" });
    expect(result.ok && result.data.slug).toBe("sunday-best-shirt");
    expect(slugify("  Ćafé  Crème ")).toBe("cafe-creme");
  });

  it("reports precise field errors", () => {
    const result = validateProduct({
      ...valid,
      name: "x",
      slug: "Bad Slug",
      priceEur: -5,
      stock: { ...valid.stock, M: -1 },
      art: { ...valid.art, base: "red", pattern: { type: "plaid", band: "#zzzzzz", line: "#000000" } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["art.base", "art.pattern.band", "name", "priceEur", "slug", "stock.M"].sort());
    }
  });

  it("rejects unsafe panel paths", () => {
    const result = validateProduct({
      ...valid,
      art: { ...valid.art, panels: [{ side: "front", path: "M0 0 <script>", fill: "#000000" }] },
    });
    expect(result.ok).toBe(false);
  });
});

describe("LiqPay", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.LIQPAY_PUBLIC_KEY = "sandbox_i000000";
    process.env.LIQPAY_PRIVATE_KEY = "sandbox_secret";
  });
  afterEach(() => {
    process.env = { ...env };
  });

  const order: Order = {
    id: "RR-ABCD2345",
    createdAt: "",
    updatedAt: "",
    status: "pending_payment",
    currency: "GBP",
    lines: [],
    subtotal: 8500,
    shipping: 0,
    total: 8500,
    customer: {} as Order["customer"],
  };

  it("builds a signed sandbox checkout and charges unsupported currencies in EUR", async () => {
    const { buildCheckout, sign } = await import("@/services/payments/liqpay");
    const { url, fields } = buildCheckout(order, "https://shop.example");
    expect(url).toBe("https://www.liqpay.ua/api/3/checkout");
    expect(fields.signature).toBe(createHash("sha1").update(`sandbox_secret${fields.data}sandbox_secret`).digest("base64"));
    expect(fields.signature).toBe(sign(fields.data, "sandbox_secret"));
    const params = JSON.parse(Buffer.from(fields.data, "base64").toString());
    expect(params).toMatchObject({ order_id: "RR-ABCD2345", currency: "EUR", amount: 100, sandbox: 1, server_url: "https://shop.example/api/payments/liqpay" });
  });

  it("verifies callbacks and maps statuses", async () => {
    const { sign, statusFromLiqPay, verifyCallback } = await import("@/services/payments/liqpay");
    const data = Buffer.from(JSON.stringify({ order_id: "RR-ABCD2345", status: "sandbox" })).toString("base64");
    expect(verifyCallback(data, sign(data, "sandbox_secret"))?.order_id).toBe("RR-ABCD2345");
    expect(verifyCallback(data, sign(data, "wrong"))).toBeNull();
    expect(verifyCallback(data, null)).toBeNull();
    expect(statusFromLiqPay("success")).toBe("paid");
    expect(statusFromLiqPay("sandbox")).toBe("paid");
    expect(statusFromLiqPay("failure")).toBe("cancelled");
    expect(statusFromLiqPay("wait_secure")).toBeUndefined();
  });
});

describe("admin session tokens", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("issues tokens that verify until they expire, and only with the same password", async () => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    const { createSessionToken, verifySessionToken, checkPassword } = await import("@/services/auth/adminSession");
    const now = Date.now();
    const { token } = createSessionToken(now);
    expect(verifySessionToken(token, now + 1000)).toBe(true);
    expect(verifySessionToken(token, now + 13 * 3600_000)).toBe(false);
    expect(verifySessionToken(token.replace(/.$/, "x"), now)).toBe(false);
    expect(checkPassword("correct-horse-battery")).toBe(true);
    expect(checkPassword("wrong")).toBe(false);

    process.env.ADMIN_PASSWORD = "a-different-password";
    expect(verifySessionToken(token, now + 1000)).toBe(false);
  });

  it("disables the admin when no password is configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    const { checkPassword, isAdminConfigured } = await import("@/services/auth/adminSession");
    expect(isAdminConfigured()).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
});
