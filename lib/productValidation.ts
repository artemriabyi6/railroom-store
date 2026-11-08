import { CATEGORIES } from "@/lib/catalog";
import type { FieldErrors, ValidationResult } from "@/types/commerce";
import { SIZES, type FabricPattern, type GarmentArtwork, type GarmentKind, type GarmentPanel, type Product } from "@/types/product";

/** Validation shared by the admin product form (client) and the save action (server). */

export const GARMENT_KINDS: { value: GarmentKind; label: string }[] = [
  { value: "tee", label: "T-shirt" },
  { value: "shirt", label: "Shirt" },
  { value: "overshirt", label: "Overshirt" },
  { value: "hoodie", label: "Pullover hoodie" },
  { value: "zipHoodie", label: "Zip hoodie" },
  { value: "jacket", label: "Work jacket" },
  { value: "track", label: "Track top" },
  { value: "vest", label: "Knit vest" },
  { value: "trousers", label: "Trousers" },
  { value: "shorts", label: "Shorts" },
];

const HEX = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SVG_PATH = /^[MLCQZHVSTAmlcqzhvsta0-9 ,.\-]+$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const color = (v: unknown) => (typeof v === "string" && HEX.test(v) ? v.toLowerCase() : null);

function validatePattern(raw: unknown, errors: FieldErrors): FabricPattern {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (p.type) {
    case "plaid": {
      const band = color(p.band);
      const line = color(p.line);
      if (!band) errors["art.pattern.band"] = "Choose a check band colour.";
      if (!line) errors["art.pattern.line"] = "Choose a check line colour.";
      return { type: "plaid", band: band ?? "#000000", line: line ?? "#000000" };
    }
    case "stripe": {
      const stripe = color(p.stripe);
      const width = Number(p.width ?? 4);
      if (!stripe) errors["art.pattern.stripe"] = "Choose a stripe colour.";
      if (!Number.isFinite(width) || width < 1 || width > 12) errors["art.pattern.width"] = "Stripe width must be 1–12.";
      return { type: "stripe", stripe: stripe ?? "#000000", width: Math.round(width * 10) / 10 };
    }
    case "rib": {
      const line = p.line == null || p.line === "" ? undefined : color(p.line);
      if (line === null) errors["art.pattern.line"] = "Invalid rib colour.";
      return line ? { type: "rib", line } : { type: "rib" };
    }
    case "solid":
    case undefined:
      return { type: "solid" };
    default:
      errors["art.pattern"] = "Unknown fabric pattern.";
      return { type: "solid" };
  }
}

function validatePanels(raw: unknown, errors: FieldErrors): GarmentPanel[] | undefined {
  if (raw == null) return undefined;
  if (!Array.isArray(raw) || raw.length > 8) {
    errors["art.panels"] = "Panels must be a list of up to 8 items.";
    return undefined;
  }
  const panels: GarmentPanel[] = [];
  raw.forEach((item, i) => {
    const p = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const path = str(p.path);
    const fill = color(p.fill);
    const piping = p.piping == null || p.piping === "" ? undefined : color(p.piping);
    if ((p.side !== "front" && p.side !== "back") || !path || path.length > 2000 || !SVG_PATH.test(path) || !fill || piping === null) {
      errors["art.panels"] = `Panel ${i + 1} is invalid (needs side, an SVG path and hex colours).`;
      return;
    }
    panels.push({ side: p.side, path, fill, ...(piping ? { piping } : {}) });
  });
  return panels.length ? panels : undefined;
}

function validateArt(raw: unknown, errors: FieldErrors): GarmentArtwork {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = GARMENT_KINDS.some((k) => k.value === a.kind) ? (a.kind as GarmentKind) : null;
  if (!kind) errors["art.kind"] = "Choose a garment type.";
  const base = color(a.base);
  if (!base) errors["art.base"] = "Choose a base colour.";

  const art: GarmentArtwork = { kind: kind ?? "tee", base: base ?? "#cccccc", pattern: validatePattern(a.pattern, errors) };

  const optionalColor = (key: "trim" | "hardware" | "sleeveStripe") => {
    if (a[key] == null || a[key] === "") return;
    const c = color(a[key]);
    if (!c) errors[`art.${key}`] = "Invalid colour.";
    else art[key] = c;
  };
  optionalColor("trim");
  optionalColor("hardware");
  optionalColor("sleeveStripe");

  if (a.sleeves === "short" || a.sleeves === "long") art.sleeves = a.sleeves;
  const backPrint = str(a.backPrint);
  if (backPrint.length > 24) errors["art.backPrint"] = "Back print must be 24 characters or fewer.";
  else if (backPrint) art.backPrint = backPrint;
  if (a.drawcord === true) art.drawcord = true;
  if (a.cargo === true) art.cargo = true;
  const panels = validatePanels(a.panels, errors);
  if (panels) art.panels = panels;
  return art;
}

export function validateProduct(input: unknown): ValidationResult<Product> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = str(raw.name);
  if (name.length < 2 || name.length > 80) errors.name = "Name must be 2–80 characters.";

  const slug = str(raw.slug) || slugify(name);
  if (!SLUG.test(slug) || slug.length > 60) errors.slug = "Use lowercase letters, numbers and dashes (e.g. night-check-shirt).";

  const colorName = str(raw.colorName);
  if (colorName.length < 1 || colorName.length > 60) errors.colorName = "Colour name is required (max 60 characters).";

  const category = CATEGORIES.find((c) => c === raw.category);
  if (!category) errors.category = "Choose a category.";

  const priceEur = Number(raw.priceEur);
  if (!Number.isInteger(priceEur) || priceEur < 0 || priceEur > 10_000_000) errors.priceEur = "Enter a price between 0 and 100,000.";

  const description = str(raw.description);
  if (description.length > 1000) errors.description = "Description must be 1000 characters or fewer.";

  const details = (Array.isArray(raw.details) ? raw.details : []).map(str).filter(Boolean);
  if (details.length > 12 || details.some((d) => d.length > 120)) errors.details = "Up to 12 detail lines, 120 characters each.";

  const stockRaw = (raw.stock && typeof raw.stock === "object" ? raw.stock : {}) as Record<string, unknown>;
  const stock = {} as Product["stock"];
  for (const size of SIZES) {
    const qty = Number(stockRaw[size] ?? 0);
    if (!Number.isInteger(qty) || qty < 0 || qty > 99_999) errors[`stock.${size}`] = "0–99,999";
    stock[size] = Number.isInteger(qty) && qty >= 0 ? qty : 0;
  }

  const art = validateArt(raw.art, errors);

  if (Object.keys(errors).length) return { ok: false, errors };
  const product: Product = { slug, name, colorName, category: category!, priceEur, description, details, stock, art };
  if (raw.rail === true) product.rail = true;
  if (raw.isNew === true) product.isNew = true;
  return { ok: true, data: product };
}
