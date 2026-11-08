import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/layout/ContentPage";
import { Spinner } from "@/components/ui/Spinner";
import { OrderLookup } from "@/features/account/OrderLookup";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your order with your order number and email.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return (
    <ContentPage eyebrow="Account" title="Track your order" intro="Enter your order number and the email you used at checkout.">
      <Suspense fallback={<Spinner size={24} label="Loading" />}>
        <OrderLookup />
      </Suspense>
    </ContentPage>
  );
}
