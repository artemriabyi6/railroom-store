import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/features/admin/ProductEditor";
import { findProduct } from "@/services/catalog/repository";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[slug]">) {
  const { slug } = await params;
  const product = await findProduct(decodeURIComponent(slug));
  if (!product) notFound();
  return <ProductEditor initial={product} />;
}
