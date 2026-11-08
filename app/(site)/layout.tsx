import { SiteFrame } from "@/components/layout/SiteFrame";

/** Every storefront page shares the header, footer, bag and chat. The admin panel does not. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteFrame>{children}</SiteFrame>;
}
