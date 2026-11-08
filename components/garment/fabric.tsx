import type { GarmentArtwork } from "@/types/product";

export const OUTLINE = "rgb(0 0 0 / 0.22)";
export const SEAM = "rgb(0 0 0 / 0.16)";

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    const v = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  return `#${[ch(16), ch(8), ch(0)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum < 90;
}

export function FabricDefs({ art, id }: { art: GarmentArtwork; id: string }) {
  const { pattern, base } = art;
  switch (pattern.type) {
    case "plaid":
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill={base} />
          <rect width="22" height="8" fill={pattern.band} opacity="0.6" />
          <rect width="8" height="22" fill={pattern.band} opacity="0.6" />
          <rect y="15" width="22" height="1.2" fill={pattern.line} opacity="0.85" />
          <rect x="15" width="1.2" height="22" fill={pattern.line} opacity="0.85" />
          <rect y="3.5" width="22" height="0.8" fill="#000" opacity="0.18" />
          <rect x="3.5" width="0.8" height="22" fill="#000" opacity="0.18" />
        </pattern>
      );
    case "stripe": {
      const w = pattern.width ?? 4;
      return (
        <pattern id={id} width={w * 2.6} height="10" patternUnits="userSpaceOnUse">
          <rect width={w * 2.6} height="10" fill={base} />
          <rect width={w} height="10" fill={pattern.stripe} />
        </pattern>
      );
    }
    case "rib":
      return (
        <pattern id={id} width="4.5" height="10" patternUnits="userSpaceOnUse">
          <rect width="4.5" height="10" fill={base} />
          <rect width="1.4" height="10" fill={pattern.line ?? "#000"} opacity={pattern.line ? 1 : 0.14} />
        </pattern>
      );
    default:
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={base} />
        </pattern>
      );
  }
}
