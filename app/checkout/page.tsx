import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/layout/ContentPage";
import { Spinner } from "@/components/ui/Spinner";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <ContentPage eyebrow="Secure checkout" title="Checkout" wide>
      <Suspense fallback={<Spinner size={24} label="Loading checkout" />}>
        <CheckoutForm />
      </Suspense>
    </ContentPage>
  );
}
