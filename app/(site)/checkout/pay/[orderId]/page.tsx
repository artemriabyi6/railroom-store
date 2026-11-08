import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/layout/ContentPage";
import { ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { completeDemoPayment } from "@/features/checkout/demoPaymentActions";
import styles from "@/features/checkout/DemoPayment.module.scss";
import { formatMinor } from "@/lib/currency";
import { isOrderId, normalizeOrderId } from "@/lib/validation";
import { findOrder } from "@/services/orders/store";
import { activePaymentProvider } from "@/services/payments";

/** Order-specific and never prerendered; the shared header reads the URL, so allow a blocking render. */
export const instant = false;

export const metadata: Metadata = {
  title: "Test payment",
  robots: { index: false, follow: false },
};

export default function DemoPaymentPage({ params }: PageProps<"/checkout/pay/[orderId]">) {
  return (
    <ContentPage eyebrow="Checkout" title="Test payment">
      <Suspense fallback={<Spinner size={24} label="Loading order" />}>
        <DemoPayment params={params} />
      </Suspense>
    </ContentPage>
  );
}

async function DemoPayment({ params }: { params: PageProps<"/checkout/pay/[orderId]">["params"] }) {
  const id = normalizeOrderId((await params).orderId);
  const order = isOrderId(id) ? await findOrder(id) : undefined;

  if (!order || order.paymentProvider !== "demo" || activePaymentProvider() !== "demo") {
    return (
      <div className={styles.box}>
        <p>This payment link isn&apos;t valid.</p>
        <ButtonLink href="/account" variant="outline">
          Track an order
        </ButtonLink>
      </div>
    );
  }

  if (order.status !== "pending_payment") {
    return (
      <div className={styles.box}>
        <p>
          Order <strong>{order.id}</strong> is already {order.status === "paid" ? "paid" : "cancelled"}.
        </p>
        <ButtonLink href={`/account?order=${order.id}`}>Track this order</ButtonLink>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <p className={styles.notice} role="note">
        <strong>Demo mode.</strong> This store has no payment provider connected yet, so payments are simulated. No card details are
        requested and no money is charged.
      </p>
      <dl className={styles.summary}>
        <div>
          <dt>Order</dt>
          <dd>{order.id}</dd>
        </div>
        <div>
          <dt>Items</dt>
          <dd>{order.lines.reduce((n, l) => n + l.quantity, 0)}</dd>
        </div>
        <div className={styles.total}>
          <dt>Total</dt>
          <dd>{formatMinor(order.total, order.currency)}</dd>
        </div>
      </dl>
      <form action={completeDemoPayment} className={styles.actions}>
        <input type="hidden" name="orderId" value={order.id} />
        <button type="submit" name="outcome" value="success" className={styles.pay}>
          Simulate successful payment
        </button>
        <button type="submit" name="outcome" value="failure" className={styles.fail}>
          Simulate failed payment
        </button>
      </form>
    </div>
  );
}
