"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { GarmentArt } from "@/components/garment/GarmentArt";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { shippingCountries } from "@/config/site";
import { cartActions, useCart } from "@/features/cart/cartStore";
import { useCurrency } from "@/features/currency/currencyStore";
import { postJson } from "@/lib/api";
import { useCatalog } from "@/features/catalog/CatalogProvider";
import { findProduct } from "@/lib/catalog";
import { priceCart } from "@/lib/pricing";
import { validateCustomer, type CustomerField } from "@/lib/validation";
import type { CustomerDetails, FieldErrors } from "@/types/commerce";
import styles from "./CheckoutForm.module.scss";

const EMPTY: CustomerDetails = { email: "", fullName: "", phone: "", address1: "", address2: "", city: "", postalCode: "", country: "" };
import { LAST_ORDER_KEY } from "./constants";

interface OrderResponse {
  orderId: string;
  status: string;
  provider: "liqpay" | "stripe" | "demo";
  payment: { method: "GET" | "POST"; url: string; fields?: Record<string, string> };
}

/** Continue to the payment provider. LiqPay expects a POSTed form; others are plain redirects. */
function goToPayment({ method, url, fields }: OrderResponse["payment"]) {
  if (method === "GET") {
    window.location.assign(url);
    return;
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "utf-8";
  for (const [name, value] of Object.entries(fields ?? {})) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm() {
  const { lines } = useCart();
  const { currency, formatMinor } = useCurrency();
  const cancelled = useSearchParams().get("cancelled") === "1";
  const [values, setValues] = useState<CustomerDetails>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<CustomerField>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const catalog = useCatalog();
  const priced = priceCart(catalog, lines, currency);

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Your bag is empty</p>
        <p>Add something from the rail before checking out.</p>
        <ButtonLink href="/" variant="outline">
          Back to the rail
        </ButtonLink>
      </div>
    );
  }

  const update = (key: CustomerField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const focusFirstError = (errs: FieldErrors<CustomerField>) => {
    const first = Object.keys(errs)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const check = validateCustomer(values);
    if (!check.ok) {
      setErrors(check.errors);
      focusFirstError(check.errors);
      return;
    }
    if (!priced.ok) {
      setFormError("Some items in your bag are no longer available. Please review your bag.");
      return;
    }
    setSubmitting(true);
    const res = await postJson<OrderResponse>("/api/orders", { items: lines, currency, customer: check.data });
    if (res.ok) {
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, res.data.orderId);
      } catch {
        /* storage unavailable: the bag simply won't auto-clear */
      }
      goToPayment(res.data.payment);
      return;
    }
    setSubmitting(false);
    if (res.data.fields) {
      const fields = res.data.fields as FieldErrors<CustomerField>;
      setErrors(fields);
      focusFirstError(fields);
    }
    setFormError(res.status === 0 ? "You appear to be offline. Check your connection and try again." : String(res.data.error ?? "Something went wrong."));
  };

  return (
    <div className={styles.layout}>
      <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-describedby={formError ? "checkout-error" : undefined}>
        {cancelled && (
          <p className={styles.notice} role="status">
            Payment was cancelled. Your bag is saved, so you can try again whenever you&apos;re ready.
          </p>
        )}
        <fieldset className={styles.group}>
          <legend>Contact</legend>
          <TextField label="Email" name="email" type="email" autoComplete="email" required value={values.email} onChange={update("email")} error={errors.email} />
          <TextField label="Phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update("phone")} error={errors.phone} hint="For delivery updates only." />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Shipping address</legend>
          <TextField label="Full name" name="fullName" autoComplete="name" required value={values.fullName} onChange={update("fullName")} error={errors.fullName} />
          <TextField label="Address" name="address1" autoComplete="address-line1" required value={values.address1} onChange={update("address1")} error={errors.address1} />
          <TextField label="Apartment, suite, etc." name="address2" autoComplete="address-line2" value={values.address2} onChange={update("address2")} error={errors.address2} />
          <div className={styles.row}>
            <TextField label="City" name="city" autoComplete="address-level2" required value={values.city} onChange={update("city")} error={errors.city} />
            <TextField label="Postal code" name="postalCode" autoComplete="postal-code" required value={values.postalCode} onChange={update("postalCode")} error={errors.postalCode} />
          </div>
          <SelectField label="Country" name="country" autoComplete="country-name" required value={values.country} onChange={update("country")} error={errors.country}>
            <option value="" disabled>
              Select a country
            </option>
            {shippingCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </fieldset>

        {formError && (
          <p id="checkout-error" className={styles.error} role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" block loading={submitting}>
          {submitting ? "Placing order…" : priced.ok ? `Place order · ${formatMinor(priced.priced.total)}` : "Place order"}
        </Button>
        <p className={styles.fine}>
          Next you&apos;ll be taken to secure payment. Your items are reserved as soon as you place the order.
        </p>
      </form>

      <aside className={styles.summary} aria-label="Order summary">
        <h2 className={styles.summaryTitle}>Order summary</h2>
        <ul className={styles.lines}>
          {lines.map((line) => {
            const product = findProduct(catalog, line.slug);
            if (!product) return null;
            const unit = priced.ok ? priced.priced.lines.find((l) => l.slug === line.slug && l.size === line.size)?.unitAmount : undefined;
            return (
              <li key={`${line.slug}-${line.size}`} className={styles.line}>
                <span className={styles.thumb}>
                  <GarmentArt art={product.art} uid={`co-${line.slug}-${line.size}`} showHanger={false} />
                  <span className={styles.qty} aria-label={`Quantity ${line.quantity}`}>
                    {line.quantity}
                  </span>
                </span>
                <span className={styles.lineInfo}>
                  <span className={styles.lineName}>{product.name}</span>
                  <span className={styles.lineSub}>
                    {product.colorName} · {line.size}
                  </span>
                </span>
                <span>{unit !== undefined ? formatMinor(unit * line.quantity) : "—"}</span>
              </li>
            );
          })}
        </ul>
        {priced.ok ? (
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMinor(priced.priced.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{priced.priced.shipping === 0 ? "Free" : formatMinor(priced.priced.shipping)}</dd>
            </div>
            <div className={styles.grand}>
              <dt>Total</dt>
              <dd>{formatMinor(priced.priced.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className={styles.error}>Some items are unavailable. Please update your bag.</p>
        )}
        <Button variant="link" onClick={cartActions.open} className={styles.edit}>
          Edit bag
        </Button>
      </aside>
    </div>
  );
}
