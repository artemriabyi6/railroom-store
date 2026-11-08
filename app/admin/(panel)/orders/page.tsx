import type { Metadata } from "next";
import { OrdersTable } from "@/features/admin/OrdersTable";
import { listOrders } from "@/services/orders/store";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  return <OrdersTable orders={await listOrders()} />;
}
