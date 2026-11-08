import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { products as C } from "@/data/products";
import { addLine, canAddMore, countItems, parseCart, reconcileCart, removeLine, setQuantity } from "@/lib/cart";
import { findProduct, railProducts, relatedProducts, searchProducts, stockLevel } from "@/lib/catalog";
import { convertFromEur, formatMinor } from "@/lib/currency";
import { priceCart } from "@/lib/pricing";
import { isOrderId, validateContact, validateCustomer } from "@/lib/validation";
import { verifyStripeSignature } from "@/services/payments/stripe";

const get = (slug: string) => findProduct(C, slug)!;

const validCustomer = {
  email: "Buyer@Example.test",
  fullName: "Test Buyer",
  phone: "",
  address1: "1 Example Street",
  address2: "",
  city: "Dublin",
  postalCode: "D02 X285",
  country: "Ireland",
};

describe("cart", () => {
  it("adds, merges and counts lines", () => {
    let lines = addLine(C, [], "plain-heavy-tee", "M");
    lines = addLine(C, lines, "plain-heavy-tee", "M", 2);
    lines = addLine(C, lines, "plain-heavy-tee", "L");
    expect(lines).toEqual([
      { slug: "plain-heavy-tee", size: "M", quantity: 3 },
      { slug: "plain-heavy-tee", size: "L", quantity: 1 },
    ]);
    expect(countItems(lines)).toBe(4);
  });

  it("clamps quantity to stock and per-line maximum", () => {
    const vest = get("ember-knit-vest");
    const lines = setQuantity(C, addLine(C, [], vest.slug, "S"), vest.slug, "S", 99);
    expect(lines[0].quantity).toBe(vest.stock.S);
    expect(canAddMore(C, lines, vest.slug, "S")).toBe(false);
  });

  it("refuses sold-out sizes and removes lines at zero", () => {
    expect(addLine(C, [], "current-split-shirt", "M")).toEqual([]);
    const lines = addLine(C, [], "plain-heavy-tee", "S");
    expect(setQuantity(C, lines, "plain-heavy-tee", "S", 0)).toEqual([]);
    expect(removeLine(lines, "plain-heavy-tee", "S")).toEqual([]);
  });

  it("parses untrusted data structurally, then reconciles with the catalogue", () => {
    expect(parseCart("nope")).toEqual([]);
    const parsed = parseCart([
      { slug: "plain-heavy-tee", size: "M", quantity: 2 },
      { slug: "unknown", size: "M", quantity: 1 },
      { slug: "plain-heavy-tee", size: "XXS", quantity: 1 },
      { slug: "plain-heavy-tee", size: "M", quantity: 1 },
      null,
    ]);
    expect(parsed).toEqual([
      { slug: "plain-heavy-tee", size: "M", quantity: 3 },
      { slug: "unknown", size: "M", quantity: 1 },
    ]);
    // A product removed by an admin disappears from the bag.
    expect(reconcileCart(C, parsed)).toEqual([{ slug: "plain-heavy-tee", size: "M", quantity: 3 }]);
  });
});

describe("pricing", () => {
  it("charges flat shipping below the free threshold", () => {
    const result = priceCart(C, [{ slug: "plain-heavy-tee", size: "M", quantity: 1 }], "EUR");
    expect(result.ok && result.priced).toMatchObject({ subtotal: 6000, shipping: 1200, total: 7200 });
  });

  it("ships free at or above the threshold", () => {
    const result = priceCart(C, [{ slug: "field-canvas-jacket", size: "M", quantity: 1 }], "EUR");
    expect(result.ok && result.priced.shipping).toBe(0);
  });

  it("converts to the order currency", () => {
    const result = priceCart(C, [{ slug: "plain-heavy-tee", size: "M", quantity: 2 }], "UAH");
    expect(result.ok && result.priced.lines[0].unitAmount).toBe(convertFromEur(6000, "UAH"));
  });

  it("rejects unknown products and over-stock quantities", () => {
    expect(priceCart(C, [{ slug: "missing", size: "M", quantity: 1 }], "EUR").ok).toBe(false);
    expect(priceCart(C, [{ slug: "current-split-shirt", size: "M", quantity: 1 }], "EUR").ok).toBe(false);
  });
});

describe("currency", () => {
  it("formats minor units", () => {
    expect(formatMinor(19000, "EUR")).toContain("190.00");
    expect(formatMinor(convertFromEur(10000, "NGN"), "NGN")).toContain("165,000.00");
  });
});

describe("catalog search", () => {
  it("filters by text and category and sorts", () => {
    expect(searchProducts(C, { text: "moss check" }).map((p) => p.slug)).toEqual(["moss-check-overshirt"]);
    expect(searchProducts(C, { category: "hoodies" }).every((p) => p.category === "hoodies")).toBe(true);
    const asc = searchProducts(C, { sort: "price-asc" });
    for (let i = 1; i < asc.length; i++) expect(asc[i - 1].priceEur).toBeLessThanOrEqual(asc[i].priceEur);
  });

  it("filters by size availability and stock", () => {
    const inM = searchProducts(C, { size: "M" });
    expect(inM.every((p) => p.stock.M > 0)).toBe(true);
    expect(inM.some((p) => p.slug === "current-split-shirt")).toBe(false);
    const inStock = searchProducts(C, { inStockOnly: true });
    expect(inStock.some((p) => p.slug === "canvas-cargo-shorts")).toBe(false);
    expect(inStock.length).toBe(C.length - 1);
  });

  it("puts new pieces first when sorting by newest", () => {
    const sorted = searchProducts(C, { sort: "new" });
    const firstOld = sorted.findIndex((p) => !p.isNew);
    expect(sorted.slice(firstOld).some((p) => p.isNew)).toBe(false);
  });

  it("keeps the seed rail and catalogue consistent", () => {
    expect(railProducts(C)).toHaveLength(9);
    const slugs = C.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const related = relatedProducts(C, get("night-pleat-trousers"));
    expect(related).toHaveLength(4);
    expect(related.some((p) => p.slug === "night-pleat-trousers")).toBe(false);
    expect(related[0].category).toBe("bottoms");
  });

  it("reports stock levels", () => {
    const shirt = get("current-split-shirt");
    expect(stockLevel(shirt, "M")).toBe("out");
    expect(stockLevel(shirt, "2XL")).toBe("low");
    expect(stockLevel(shirt, "L")).toBe("in");
  });
});

describe("validation", () => {
  it("accepts and normalises a valid customer", () => {
    const result = validateCustomer(validCustomer);
    expect(result.ok && result.data.email).toBe("buyer@example.test");
  });

  it("reports field errors", () => {
    const result = validateCustomer({ ...validCustomer, email: "nope", country: "Atlantis", postalCode: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["country", "email", "postalCode"]);
  });

  it("validates contact messages and order ids", () => {
    expect(validateContact({ name: "Ann", email: "ann@example.test", message: "Long enough message" }).ok).toBe(true);
    expect(validateContact({ name: "", email: "x", message: "" }).ok).toBe(false);
    expect(isOrderId("RR-ABCD2345")).toBe(true);
    expect(isOrderId("RR-abc")).toBe(false);
  });
});

describe("stripe webhook signature", () => {
  const secret = "whsec_test";
  const payload = JSON.stringify({ type: "checkout.session.completed" });
  const sign = (t: number) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

  it("accepts a valid, fresh signature", () => {
    expect(verifyStripeSignature(payload, sign(Math.floor(Date.now() / 1000)), secret)).toBe(true);
  });

  it("rejects tampered, stale or missing signatures", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(verifyStripeSignature(payload + " ", sign(now), secret)).toBe(false);
    expect(verifyStripeSignature(payload, sign(now - 3600), secret)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret)).toBe(false);
  });
});
