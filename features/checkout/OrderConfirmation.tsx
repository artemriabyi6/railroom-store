"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { cartActions } from "@/features/cart/cartStore";
import { isOrderId, normalizeOrderId } from "@/lib/validation";
import { LAST_ORDER_KEY } from "./constants";
import styles from "./OrderConfirmation.module.scss";

export function OrderConfirmation() {
  const raw = useSearchParams().get("order") ?? "";
  const orderId = normalizeOrderId(raw);
  const valid = isOrderId(orderId);

  // Clear the bag only for the order this browser just placed.
  useEffect(() => {
    if (!valid) return;
    try {
      if (sessionStorage.getItem(LAST_ORDER_KEY) === orderId) {
        cartActions.clear();
        sessionStorage.removeItem(LAST_ORDER_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, [orderId, valid]);

  if (!valid) {
    return (
      <div className={styles.box}>
        <p>We couldn&apos;t read an order number from this link.</p>
        <ButtonLink href="/account" variant="outline">
          Track an order
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <span className={styles.check}>
        <CheckIcon size={26} />
      </span>
      <p className={styles.label}>Order number</p>
      <p className={styles.id}>{orderId}</p>
      <p className={styles.copy}>
        Thank you. Your pieces are reserved. Keep this number: you can check your order status at any time using it and the email you
        entered at checkout.
      </p>
      <div className={styles.actions}>
        <ButtonLink href={`/account?order=${encodeURIComponent(orderId)}`}>Track this order</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back to the rail
        </ButtonLink>
      </div>
    </div>
  );
}
