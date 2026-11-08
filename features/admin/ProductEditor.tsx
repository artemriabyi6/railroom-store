"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toastStore";
import { categoryLabels, CATEGORIES } from "@/lib/catalog";
import { GARMENT_KINDS, slugify, validateProduct } from "@/lib/productValidation";
import type { FieldErrors } from "@/types/commerce";
import { isBottomKind, SIZES, type GarmentArtwork, type GarmentKind, type Product, type ProductCategory, type Size } from "@/types/product";
import { deleteProductAction, saveProductAction } from "./actions";
import styles from "./Admin.module.scss";

type PatternType = "solid" | "plaid" | "stripe" | "rib";

interface Draft {
  name: string;
  slug: string;
  slugTouched: boolean;
  colorName: string;
  category: ProductCategory;
  price: string;
  description: string;
  details: string;
  stock: Record<Size, string>;
  rail: boolean;
  isNew: boolean;
  kind: GarmentKind;
  base: string;
  patternType: PatternType;
  band: string;
  line: string;
  stripe: string;
  stripeWidth: string;
  ribLineOn: boolean;
  ribLine: string;
  trimOn: boolean;
  trim: string;
  hardwareOn: boolean;
  hardware: string;
  sleeves: "short" | "long";
  sleeveStripeOn: boolean;
  sleeveStripe: string;
  backPrint: string;
  drawcord: boolean;
  cargo: boolean;
  panelsJson: string;
}

function toDraft(p: Product | null): Draft {
  const art = p?.art;
  const pattern = art?.pattern ?? { type: "solid" as const };
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    slugTouched: Boolean(p),
    colorName: p?.colorName ?? "",
    category: p?.category ?? "shirts",
    price: p ? (p.priceEur / 100).toFixed(2) : "",
    description: p?.description ?? "",
    details: (p?.details ?? []).join("\n"),
    stock: Object.fromEntries(SIZES.map((s) => [s, String(p?.stock[s] ?? 0)])) as Record<Size, string>,
    rail: Boolean(p?.rail),
    isNew: p ? Boolean(p.isNew) : true,
    kind: art?.kind ?? "tee",
    base: art?.base ?? "#2c3557",
    patternType: pattern.type,
    band: pattern.type === "plaid" ? pattern.band : "#4a5683",
    line: pattern.type === "plaid" ? pattern.line : "#8a6a3a",
    stripe: pattern.type === "stripe" ? pattern.stripe : "#6d93c8",
    stripeWidth: pattern.type === "stripe" ? String(pattern.width ?? 4) : "4",
    ribLineOn: pattern.type === "rib" && Boolean(pattern.line),
    ribLine: pattern.type === "rib" && pattern.line ? pattern.line : "#000000",
    trimOn: Boolean(art?.trim),
    trim: art?.trim ?? "#222222",
    hardwareOn: Boolean(art?.hardware),
    hardware: art?.hardware ?? "#e9e4d8",
    sleeves: art?.sleeves ?? (art?.kind === "tee" ? "short" : "long"),
    sleeveStripeOn: Boolean(art?.sleeveStripe),
    sleeveStripe: art?.sleeveStripe ?? "#f3efe6",
    backPrint: art?.backPrint ?? "",
    drawcord: Boolean(art?.drawcord),
    cargo: Boolean(art?.cargo),
    panelsJson: art?.panels ? JSON.stringify(art.panels, null, 2) : "",
  };
}

function buildArt(d: Draft): { art: Record<string, unknown>; panelsError?: string } {
  const pattern =
    d.patternType === "plaid"
      ? { type: "plaid", band: d.band, line: d.line }
      : d.patternType === "stripe"
        ? { type: "stripe", stripe: d.stripe, width: Number(d.stripeWidth) }
        : d.patternType === "rib"
          ? d.ribLineOn
            ? { type: "rib", line: d.ribLine }
            : { type: "rib" }
          : { type: "solid" };
  const art: Record<string, unknown> = { kind: d.kind, base: d.base, pattern };
  if (d.trimOn) art.trim = d.trim;
  if (d.hardwareOn) art.hardware = d.hardware;
  if (d.kind === "shirt" || d.kind === "tee") art.sleeves = d.sleeves;
  if (d.sleeveStripeOn) art.sleeveStripe = d.sleeveStripe;
  if (d.backPrint.trim()) art.backPrint = d.backPrint.trim();
  if (isBottomKind(d.kind)) {
    if (d.drawcord) art.drawcord = true;
    if (d.cargo) art.cargo = true;
  }
  let panelsError: string | undefined;
  if (d.panelsJson.trim()) {
    try {
      art.panels = JSON.parse(d.panelsJson);
    } catch {
      panelsError = "Panels must be valid JSON.";
    }
  }
  return { art, panelsError };
}

function toPayload(d: Draft) {
  const { art, panelsError } = buildArt(d);
  const price = d.price.replace(",", ".").trim();
  return {
    panelsError,
    payload: {
      name: d.name,
      slug: d.slug || slugify(d.name),
      colorName: d.colorName,
      category: d.category,
      priceEur: price === "" ? NaN : Math.round(Number(price) * 100),
      description: d.description,
      details: d.details.split("\n"),
      stock: Object.fromEntries(SIZES.map((s) => [s, d.stock[s] === "" ? 0 : Number(d.stock[s])])),
      rail: d.rail,
      isNew: d.isNew,
      art,
    },
  };
}

export function ProductEditor({ initial }: { initial: Product | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "name" && !d.slugTouched) next.slug = slugify(String(value));
      return next;
    });

  // Live preview: fall back to the last valid colours when a field is mid-edit.
  const previewArt = useMemo<GarmentArtwork>(() => {
    const { art } = buildArt(draft);
    const check = validateProduct({ name: "Preview", colorName: "x", category: "tops", priceEur: 0, art });
    if (check.ok) return check.data.art;
    return { kind: draft.kind, base: /^#[0-9a-f]{6}$/i.test(draft.base) ? draft.base : "#cccccc", pattern: { type: "solid" } };
  }, [draft]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const { payload, panelsError } = toPayload(draft);
    const check = validateProduct(payload);
    const nextErrors: FieldErrors = check.ok ? {} : { ...check.errors };
    if (panelsError) nextErrors["art.panels"] = panelsError;
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setMessage("Please fix the highlighted fields.");
      return;
    }
    startTransition(async () => {
      const res = await saveProductAction(payload, initial?.slug ?? null);
      if (res.ok) {
        toast(editing ? "Product updated" : "Product created", "success");
        router.push(`/admin/products?saved=${encodeURIComponent(res.slug)}`);
        router.refresh();
      } else {
        setErrors(res.errors ?? {});
        setMessage(res.message);
      }
    });
  };

  const remove = () => {
    if (!initial || !window.confirm(`Delete “${initial.name}”? This cannot be undone.`)) return;
    startTransition(async () => {
      // On success the server redirects to the list; we only get a result back on failure.
      const res = await deleteProductAction(initial.slug, { redirectToList: true });
      if (!res.ok) setMessage(res.message ?? "Could not delete.");
    });
  };

  const bottoms = isBottomKind(draft.kind);

  return (
    <form className={styles.editor} onSubmit={submit} noValidate>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/products" className={styles.back}>
            ← Products
          </Link>
          <h1 className={styles.pageTitle}>{editing ? initial!.name : "New product"}</h1>
        </div>
        <div className={styles.headActions}>
          {editing && (
            <>
              <a href={`/products/${initial!.slug}`} target="_blank" rel="noopener" className={styles.textAction}>
                View in store ↗
              </a>
              <button type="button" className={styles.dangerAction} onClick={remove} disabled={pending}>
                Delete
              </button>
            </>
          )}
          <Button type="submit" loading={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      {message && (
        <p className={styles.formError} role="alert">
          {message}
        </p>
      )}

      <div className={styles.editorGrid}>
        <div className={styles.editorMain}>
          <Card title="Basics">
            <Row>
              <Input label="Name" value={draft.name} onChange={(v) => set("name", v)} error={errors.name} required />
              <Input label="Colour name" value={draft.colorName} onChange={(v) => set("colorName", v)} error={errors.colorName} required placeholder="e.g. Navy Check" />
            </Row>
            <Row>
              <Input
                label="URL slug"
                value={draft.slug}
                onChange={(v) => setDraft((d) => ({ ...d, slug: v, slugTouched: true }))}
                error={errors.slug}
                hint={`/products/${draft.slug || slugify(draft.name) || "…"}`}
              />
              <Select label="Category" value={draft.category} onChange={(v) => set("category", v as ProductCategory)} error={errors.category}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </Select>
            </Row>
            <Row>
              <Input label="Price (EUR)" value={draft.price} onChange={(v) => set("price", v)} error={errors.priceEur} inputMode="decimal" placeholder="190.00" required />
              <div className={styles.checks}>
                <Check label="Hang on the homepage rail" checked={draft.rail} onChange={(v) => set("rail", v)} />
                <Check label="Mark as new (New in)" checked={draft.isNew} onChange={(v) => set("isNew", v)} />
              </div>
            </Row>
          </Card>

          <Card title="Description">
            <TextArea label="Description" value={draft.description} onChange={(v) => set("description", v)} error={errors.description} rows={3} />
            <TextArea label="Details (one per line)" value={draft.details} onChange={(v) => set("details", v)} error={errors.details} rows={4} />
          </Card>

          <Card title="Stock per size">
            <div className={styles.stockGrid}>
              {SIZES.map((s) => (
                <Input
                  key={s}
                  label={s}
                  type="number"
                  min={0}
                  value={draft.stock[s]}
                  onChange={(v) => setDraft((d) => ({ ...d, stock: { ...d.stock, [s]: v } }))}
                  error={errors[`stock.${s}`]}
                />
              ))}
            </div>
          </Card>

          <Card title="Garment artwork">
            <Row>
              <Select label="Garment type" value={draft.kind} onChange={(v) => set("kind", v as GarmentKind)} error={errors["art.kind"]}>
                {GARMENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
              <ColorInput label="Base colour" value={draft.base} onChange={(v) => set("base", v)} error={errors["art.base"]} />
            </Row>
            <Row>
              <Select label="Fabric" value={draft.patternType} onChange={(v) => set("patternType", v as PatternType)} error={errors["art.pattern"]}>
                <option value="solid">Solid</option>
                <option value="plaid">Check / plaid</option>
                <option value="stripe">Stripe</option>
                <option value="rib">Rib knit</option>
              </Select>
              {(draft.kind === "shirt" || draft.kind === "tee") && (
                <Select label="Sleeves" value={draft.sleeves} onChange={(v) => set("sleeves", v as "short" | "long")}>
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                </Select>
              )}
            </Row>
            {draft.patternType === "plaid" && (
              <Row>
                <ColorInput label="Check band" value={draft.band} onChange={(v) => set("band", v)} error={errors["art.pattern.band"]} />
                <ColorInput label="Check line" value={draft.line} onChange={(v) => set("line", v)} error={errors["art.pattern.line"]} />
              </Row>
            )}
            {draft.patternType === "stripe" && (
              <Row>
                <ColorInput label="Stripe colour" value={draft.stripe} onChange={(v) => set("stripe", v)} error={errors["art.pattern.stripe"]} />
                <Input label="Stripe width (1–12)" type="number" min={1} max={12} step={0.5} value={draft.stripeWidth} onChange={(v) => set("stripeWidth", v)} error={errors["art.pattern.width"]} />
              </Row>
            )}
            {draft.patternType === "rib" && <OptionalColor label="Rib line colour" on={draft.ribLineOn} onToggle={(v) => set("ribLineOn", v)} value={draft.ribLine} onChange={(v) => set("ribLine", v)} />}
            <Row>
              <OptionalColor label={bottoms ? "Waistband colour" : "Trim colour (collar, cuffs, rib)"} on={draft.trimOn} onToggle={(v) => set("trimOn", v)} value={draft.trim} onChange={(v) => set("trim", v)} error={errors["art.trim"]} />
              <OptionalColor label="Buttons / zip colour" on={draft.hardwareOn} onToggle={(v) => set("hardwareOn", v)} value={draft.hardware} onChange={(v) => set("hardware", v)} error={errors["art.hardware"]} />
            </Row>
            <Row>
              <OptionalColor
                label={bottoms ? "Side stripe colour" : "Sleeve stripe colour"}
                on={draft.sleeveStripeOn}
                onToggle={(v) => set("sleeveStripeOn", v)}
                value={draft.sleeveStripe}
                onChange={(v) => set("sleeveStripe", v)}
                error={errors["art.sleeveStripe"]}
              />
              <Input label="Back print text" value={draft.backPrint} onChange={(v) => set("backPrint", v)} error={errors["art.backPrint"]} placeholder="e.g. RAIL / 04" maxLength={24} />
            </Row>
            {bottoms && (
              <div className={styles.checks}>
                <Check label="Elastic drawcord waist" checked={draft.drawcord} onChange={(v) => set("drawcord", v)} />
                <Check label="Cargo pockets" checked={draft.cargo} onChange={(v) => set("cargo", v)} />
              </div>
            )}
            <details className={styles.advanced} open={Boolean(errors["art.panels"])}>
              <summary>Advanced: colour-blocked panels (JSON)</summary>
              <TextArea
                label='List of { "side": "front" | "back", "path": SVG path in a 240×300 box, "fill": "#hex", "piping"?: "#hex" }'
                value={draft.panelsJson}
                onChange={(v) => set("panelsJson", v)}
                error={errors["art.panels"]}
                rows={6}
                mono
              />
            </details>
          </Card>
        </div>

        <aside className={styles.preview} aria-label="Live preview">
          <p className={styles.previewLabel}>Live preview</p>
          <div className={styles.previewStage}>
            <span className={styles.previewRail} aria-hidden="true" />
            <GarmentArt art={previewArt} uid="preview-front" label="Front preview" />
            <GarmentArt art={previewArt} view="back" uid="preview-back" label="Back preview" />
          </div>
          <p className={styles.previewName}>{draft.name || "Product name"}</p>
          <p className={styles.muted}>
            {draft.colorName || "Colour"} · €{draft.price || "0.00"}
          </p>
        </aside>
      </div>
    </form>
  );
}

// ── Small form primitives (admin only) ─────────────────────────────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.card}>
      <legend className={styles.cardTitle}>{title}</legend>
      {children}
    </fieldset>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className={styles.row}>{children}</div>;

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.field} data-invalid={error ? "" : undefined}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  error,
  hint,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} {...rest} />
    </Field>
  );
}

function TextArea({ label, value, onChange, error, rows, mono }: { label: string; value: string; onChange: (v: string) => void; error?: string; rows: number; mono?: boolean }) {
  return (
    <Field label={label} error={error}>
      <textarea className={styles.input} data-mono={mono ? "" : undefined} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
    </Field>
  );
}

function Select({ label, value, onChange, error, children }: { label: string; value: string; onChange: (v: string) => void; error?: string; children: ReactNode }) {
  return (
    <Field label={label} error={error}>
      <select className={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </Field>
  );
}

function ColorInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} error={error}>
      <span className={styles.colorRow}>
        <input type="color" className={styles.swatch} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} />
        <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} spellCheck={false} />
      </span>
    </Field>
  );
}

function OptionalColor({
  label,
  on,
  onToggle,
  value,
  onChange,
  error,
}: {
  label: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className={styles.optional}>
      <Check label={label} checked={on} onChange={onToggle} />
      {on && <ColorInput label="Colour" value={value} onChange={onChange} error={error} />}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
