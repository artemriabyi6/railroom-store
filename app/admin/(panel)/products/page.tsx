import type { Metadata } from "next";
import { ProductsTable } from "@/features/admin/ProductsTable";
import { listProducts } from "@/services/catalog/repository";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  // Read straight from the repository (not the storefront cache) so edits show immediately.
  const products = await listProducts();
  return <ProductsTable products={products} />;
}
