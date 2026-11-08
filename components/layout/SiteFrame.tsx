import type { ReactNode } from "react";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { SupportLauncher } from "@/features/support/SupportLauncher";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Storefront chrome: header, main content, footer, bag drawer and support chat. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
      <SupportLauncher />
    </>
  );
}
