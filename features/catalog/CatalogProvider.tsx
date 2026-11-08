"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Catalog } from "@/lib/catalog";

const CatalogContext = createContext<Catalog>([]);

/**
 * Makes the server-loaded catalogue (from the database) available to client
 * components: bag, search, checkout, catalogue page.
 */
export function CatalogProvider({ products, children }: { products: Catalog; children: ReactNode }) {
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(CatalogContext);
}
