import type { Metadata } from "next";
import { ProductEditor } from "@/features/admin/ProductEditor";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return <ProductEditor initial={null} />;
}
