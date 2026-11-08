export const productHref = (slug: string) => `/products/${encodeURIComponent(slug)}`;

export function slugFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/^\/products\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Select (or clear) a product without a full route transition. Next.js syncs native
 * history updates with `usePathname`, so the rack and panel re-render from the URL,
 * the URL stays shareable, and back/forward work.
 */
export function selectProduct(slug: string | null) {
  const target = slug ? productHref(slug) : "/";
  if (window.location.pathname === target) return;
  window.history.pushState(null, "", target);
}

/** Opens a product from anywhere on the homepage: select it and bring the panel into view. */
export function openProductOnHome(slug: string) {
  clearReturnPath();
  selectProduct(slug);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const RETURN_KEY = "rr.returnTo";

/** Remember where a product was opened from (e.g. a filtered catalogue URL). */
export function rememberReturnPath(path: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* storage unavailable: closing simply returns to the rail */
  }
}

export function takeReturnPath(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}

/** Forget a remembered return path (e.g. when a product is opened from the rail). */
export function clearReturnPath() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
}
