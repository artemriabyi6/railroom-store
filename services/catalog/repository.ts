import "server-only";
import { products as seedProducts } from "@/data/products";
import { fromJson, getDb, hasDatabase, jsonParam, type Sql } from "@/services/db/client";
import { mutateJsonFile, readJsonFile } from "@/services/storage/jsonFile";
import type { Product, Size } from "@/types/product";

/**
 * Product catalogue persistence. Postgres when DATABASE_URL is set, otherwise a JSON
 * file. Both start from the seed catalogue in data/products.ts.
 */

export class ProductConflictError extends Error {
  constructor(slug: string) {
    super(`A product with the slug "${slug}" already exists.`);
  }
}

export class OutOfStockError extends Error {
  constructor(public slug: string, public size: Size) {
    super(`Not enough stock for ${slug} (${size}).`);
  }
}

export interface StockLine {
  slug: string;
  size: Size;
  quantity: number;
}

/** A product plus its ordering on the rail/catalogue. */
type StoredProduct = Product & { position: number };

const FILE = "products";
const seed = (): StoredProduct[] => seedProducts.map((p, i) => ({ ...p, position: i }));
const byPosition = (a: StoredProduct, b: StoredProduct) => a.position - b.position || a.name.localeCompare(b.name);
function strip(p: StoredProduct): Product {
  const { position, ...product } = p;
  void position;
  return product;
}

// ── Postgres ────────────────────────────────────────────────────────────────

interface ProductRow {
  slug: string;
  name: string;
  color_name: string;
  category: Product["category"];
  price_eur: number;
  description: string;
  details: unknown;
  stock: unknown;
  art: unknown;
  rail: boolean;
  is_new: boolean;
  position: number;
}

function fromRow(r: ProductRow): StoredProduct {
  const product: StoredProduct = {
    slug: r.slug,
    name: r.name,
    colorName: r.color_name,
    category: r.category,
    priceEur: r.price_eur,
    description: r.description,
    details: fromJson<string[]>(r.details),
    stock: fromJson<Record<Size, number>>(r.stock),
    art: fromJson<Product["art"]>(r.art),
    position: r.position,
  };
  if (r.rail) product.rail = true;
  if (r.is_new) product.isNew = true;
  return product;
}

async function insertRow(sql: Sql, p: StoredProduct) {
  await sql`
    insert into products (slug, name, color_name, category, price_eur, description, details, stock, art, rail, is_new, position)
    values (${p.slug}, ${p.name}, ${p.colorName}, ${p.category}, ${p.priceEur}, ${p.description},
            ${jsonParam(sql, p.details)}, ${jsonParam(sql, p.stock)}, ${jsonParam(sql, p.art)},
            ${Boolean(p.rail)}, ${Boolean(p.isNew)}, ${p.position})`;
}

let seeded: Promise<void> | null = null;
async function dbReady(): Promise<Sql> {
  const sql = await getDb();
  seeded ??= (async () => {
    const [{ count }] = await sql<{ count: string }[]>`select count(*)::text as count from products`;
    if (Number(count) > 0) return;
    await sql.begin(async (tx) => {
      for (const p of seed()) await insertRow(tx as unknown as Sql, p);
    });
  })().catch((err) => {
    seeded = null;
    throw err;
  });
  await seeded;
  return sql;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function listProducts(): Promise<Product[]> {
  if (hasDatabase()) {
    const sql = await dbReady();
    const rows = await sql<ProductRow[]>`select * from products order by position, name`;
    return rows.map(fromRow).map(strip);
  }
  const all = await readJsonFile<StoredProduct[]>(FILE, seed);
  return [...all].sort(byPosition).map(strip);
}

export async function findProduct(slug: string): Promise<Product | undefined> {
  if (hasDatabase()) {
    const sql = await dbReady();
    const [row] = await sql<ProductRow[]>`select * from products where slug = ${slug}`;
    return row ? strip(fromRow(row)) : undefined;
  }
  return (await listProducts()).find((p) => p.slug === slug);
}

/**
 * Create or update a product. `originalSlug` is the slug being edited (omit when creating).
 * Renaming a slug keeps the product's position.
 */
export async function saveProduct(product: Product, originalSlug?: string): Promise<void> {
  if (hasDatabase()) {
    const sql = await dbReady();
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      if (!originalSlug || originalSlug !== product.slug) {
        const [exists] = await tx`select 1 from products where slug = ${product.slug}`;
        if (exists) throw new ProductConflictError(product.slug);
      }
      let position: number;
      if (originalSlug) {
        const [row] = await tx<{ position: number }[]>`select position from products where slug = ${originalSlug} for update`;
        if (!row) throw new Error("Product not found");
        position = row.position;
        await tx`delete from products where slug = ${originalSlug}`;
      } else {
        const [{ next }] = await tx<{ next: number }[]>`select coalesce(max(position), -1) + 1 as next from products`;
        position = next;
      }
      await insertRow(tx, { ...product, position });
    });
    return;
  }
  await mutateJsonFile<StoredProduct[], void>(FILE, seed, (all) => {
    if ((!originalSlug || originalSlug !== product.slug) && all.some((p) => p.slug === product.slug)) {
      throw new ProductConflictError(product.slug);
    }
    if (originalSlug) {
      const existing = all.find((p) => p.slug === originalSlug);
      if (!existing) throw new Error("Product not found");
      return { data: all.map((p) => (p.slug === originalSlug ? { ...product, position: existing.position } : p)), result: undefined };
    }
    const position = all.reduce((m, p) => Math.max(m, p.position), -1) + 1;
    return { data: [...all, { ...product, position }], result: undefined };
  });
}

export async function deleteProduct(slug: string): Promise<void> {
  if (hasDatabase()) {
    const sql = await dbReady();
    await sql`delete from products where slug = ${slug}`;
    return;
  }
  await mutateJsonFile<StoredProduct[], void>(FILE, seed, (all) => ({ data: all.filter((p) => p.slug !== slug), result: undefined }));
}

/** Move a product one step up/down in the catalogue order. */
export async function moveProduct(slug: string, direction: -1 | 1): Promise<void> {
  const reorder = (all: StoredProduct[]) => {
    const sorted = [...all].sort(byPosition).map((p, i) => ({ ...p, position: i }));
    const i = sorted.findIndex((p) => p.slug === slug);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= sorted.length) return sorted;
    [sorted[i].position, sorted[j].position] = [sorted[j].position, sorted[i].position];
    return sorted;
  };
  if (hasDatabase()) {
    const sql = await dbReady();
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      const rows = await tx<ProductRow[]>`select * from products order by position, name for update`;
      for (const p of reorder(rows.map(fromRow))) await tx`update products set position = ${p.position} where slug = ${p.slug}`;
    });
    return;
  }
  await mutateJsonFile<StoredProduct[], void>(FILE, seed, (all) => ({ data: reorder(all), result: undefined }));
}

/**
 * Adjust stock for order lines. `sign = -1` reserves (fails atomically with
 * OutOfStockError if any line can't be fulfilled), `+1` releases.
 * Pass `tx` to run inside an existing database transaction.
 */
export async function adjustStock(lines: StockLine[], sign: -1 | 1, tx?: Sql): Promise<void> {
  if (hasDatabase()) {
    const run = async (sql: Sql) => {
      for (const l of lines) {
        const key = l.size;
        const delta = sign * l.quantity;
        const updated = await sql`
          update products
             set stock = jsonb_set(stock, array[${key}::text], to_jsonb(coalesce((stock->>${key})::int, 0) + ${delta}::int)),
                 updated_at = now()
           where slug = ${l.slug} and coalesce((stock->>${key})::int, 0) + ${delta}::int >= 0
           returning slug`;
        if (updated.length === 0) {
          if (sign < 0) throw new OutOfStockError(l.slug, l.size);
        }
      }
    };
    if (tx) return run(tx);
    const sql = await dbReady();
    await sql.begin((t) => run(t as unknown as Sql));
    return;
  }
  await mutateJsonFile<StoredProduct[], void>(FILE, seed, (all) => {
    const next = all.map((p) => ({ ...p, stock: { ...p.stock } }));
    for (const l of lines) {
      const p = next.find((x) => x.slug === l.slug);
      if (!p) {
        if (sign < 0) throw new OutOfStockError(l.slug, l.size);
        continue;
      }
      const value = (p.stock[l.size] ?? 0) + sign * l.quantity;
      if (value < 0) throw new OutOfStockError(l.slug, l.size);
      p.stock[l.size] = value;
    }
    return { data: next, result: undefined };
  });
}

/** Ensure the database is reachable, schema applied and catalogue seeded. */
export async function ensureCatalogReady(): Promise<void> {
  if (hasDatabase()) await dbReady();
}
