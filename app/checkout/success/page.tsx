import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/layout/ContentPage";
import { Spinner } from "@/components/ui/Spinner";
import { OrderConfirmation } from "@/features/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <ContentPage eyebrow="Checkout" title="Order received">
      <Suspense fallback={<Spinner size={24} label="Loading order" />}>
        <OrderConfirmation />
      </Suspense>
    </ContentPage>
  );
}
