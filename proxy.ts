import { NextResponse, type NextRequest } from "next/server";
import { getProduct } from "@/lib/catalog";

/**
 * Product pages stream their content, so an unknown slug would otherwise render the
 * not-found UI with a 200 status. Rewriting to an unmatched path returns a real 404.
 */
export function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  if (!getProduct(slug)) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/products/:slug",
};
