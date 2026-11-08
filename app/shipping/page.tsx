import type { Metadata } from "next";
import { ContentPage, Prose } from "@/components/layout/ContentPage";
import { shippingPolicy } from "@/config/site";
import { formatMinor } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Delivery times, shipping costs and our returns policy.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <ContentPage eyebrow="Help" title="Shipping & Returns">
      <Prose>
        <h2>Shipping</h2>
        <ul>
          <li>
            Flat-rate shipping is {formatMinor(shippingPolicy.flatEur, "EUR")}. Orders of {formatMinor(shippingPolicy.freeFromEur, "EUR")} or
            more ship free.
          </li>
          <li>Orders are packed within 2 working days. EU delivery takes 2–5 working days; the UK, US and Nigeria take 4–8.</li>
          <li>You can follow your order at any time with your order number and email on the Track order page.</li>
        </ul>
        <h2>Returns</h2>
        <ul>
          <li>You can return unworn items with their tags within 14 days of delivery.</li>
          <li>Start a return through the chat button and include your order number. We&apos;ll send you a return label.</li>
          <li>We refund to your original payment method within 5 working days of receiving the return.</li>
        </ul>
        <h2>Duties</h2>
        <p>Orders shipped outside the EU may be subject to import duties, which are paid by the recipient.</p>
      </Prose>
    </ContentPage>
  );
}
