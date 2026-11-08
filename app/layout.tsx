import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { siteConfig } from "@/config/site";
import { CatalogProvider } from "@/features/catalog/CatalogProvider";
import { getCatalog } from "@/services/catalog";
import "./globals.scss";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f3f3f1",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached ("use cache" + "catalog" tag): part of the static shell, refreshed when admins edit products.
  const catalog = await getCatalog();
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <CatalogProvider products={catalog}>
          {children}
          <Toaster />
        </CatalogProvider>
      </body>
    </html>
  );
}
