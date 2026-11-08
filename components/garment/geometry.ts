import type { GarmentArtwork, GarmentKind, TopKind } from "@/types/product";

/** All garment geometry lives in a 240 x 300 coordinate space, hook at the top centre. */
export const VIEW_W = 240;
export const VIEW_H = 300;
export const CX = VIEW_W / 2;

export interface Dims {
  /** Half-width at the shoulder. */
  half: number;
  /** Half-width at the hem. */
  hem: number;
  /** Shoulder line y. */
  sy: number;
  /** Hem y. */
  len: number;
  sleeves: "short" | "long" | "none";
}

const BASE: Record<TopKind, Dims> = {
  tee: { half: 50, hem: 50, sy: 56, len: 250, sleeves: "short" },
  shirt: { half: 50, hem: 52, sy: 56, len: 262, sleeves: "short" },
  overshirt: { half: 54, hem: 55, sy: 56, len: 262, sleeves: "long" },
  hoodie: { half: 56, hem: 54, sy: 58, len: 252, sleeves: "long" },
  zipHoodie: { half: 56, hem: 54, sy: 58, len: 246, sleeves: "long" },
  jacket: { half: 58, hem: 58, sy: 56, len: 250, sleeves: "long" },
  track: { half: 54, hem: 52, sy: 56, len: 246, sleeves: "long" },
  vest: { half: 48, hem: 50, sy: 56, len: 248, sleeves: "none" },
};

export function dimsFor(art: GarmentArtwork & { kind: TopKind }): Dims {
  const d = BASE[art.kind];
  if ((art.kind === "shirt" || art.kind === "tee") && art.sleeves) return { ...d, sleeves: art.sleeves };
  return d;
}

/** Coordinate pair helper — every point is emitted as "x,y" so paths can be mirrored. */
export const p = (x: number, y: number) => `${round(x)},${round(y)}`;
const round = (n: number) => Math.round(n * 10) / 10;

/** Mirror a path drawn on the left half across the vertical centre line. */
export function mirror(d: string): string {
  return d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, x: string, y: string) => `${round(VIEW_W - Number(x))},${y}`);
}

export function torsoPath(kind: GarmentKind, { half, hem, sy, len }: Dims): string {
  const neck = 15;
  if (kind === "vest") {
    const strap = half - 16;
    return [
      `M${p(CX - neck, sy - 6)}`,
      `Q${p(CX, sy + 4)} ${p(CX + neck, sy - 6)}`,
      `L${p(CX + strap, sy + 2)}`,
      `Q${p(CX + strap, sy + 44)} ${p(CX + half, sy + 62)}`,
      `L${p(CX + hem, len)}`,
      `Q${p(CX, len + 5)} ${p(CX - hem, len)}`,
      `L${p(CX - half, sy + 62)}`,
      `Q${p(CX - strap, sy + 44)} ${p(CX - strap, sy + 2)}`,
      "Z",
    ].join(" ");
  }
  return [
    `M${p(CX - neck, sy - 6)}`,
    `Q${p(CX, sy + 6)} ${p(CX + neck, sy - 6)}`,
    `L${p(CX + half, sy + 6)}`,
    `L${p(CX + hem, len)}`,
    `Q${p(CX, len + 5)} ${p(CX - hem, len)}`,
    `L${p(CX - half, sy + 6)}`,
    "Z",
  ].join(" ");
}

/** Left sleeve (viewer's left). Mirror for the right. */
export function sleevePath({ half, sy, len, sleeves }: Dims): string | null {
  const x = CX - half;
  if (sleeves === "short") {
    return `M${p(x + 6, sy + 4)} L${p(x - 26, sy + 50)} L${p(x - 6, sy + 66)} L${p(x + 3, sy + 46)} Z`;
  }
  if (sleeves === "long") {
    return [
      `M${p(x + 6, sy + 4)}`,
      `C${p(x - 14, sy + 14)} ${p(x - 20, sy + 50)} ${p(x - 20, sy + 80)}`,
      `L${p(x - 18, len - 12)}`,
      `L${p(x + 3, len - 10)}`,
      `L${p(x + 3, sy + 70)}`,
      "Z",
    ].join(" ");
  }
  return null;
}

export function cuffPath({ half, len, sleeves }: Dims, depth = 14): string | null {
  if (sleeves !== "long") return null;
  const x = CX - half;
  return `M${p(x - 18.4, len - 12 - depth)} L${p(x + 3, len - 10 - depth)} L${p(x + 3, len - 10)} L${p(x - 18, len - 12)} Z`;
}

export function sleeveHemLine({ half, sy }: Dims): string {
  const x = CX - half;
  return `M${p(x - 21, sy + 42)} L${p(x - 1, sy + 58)}`;
}

export function hemBandPath({ hem, len }: Dims, depth = 16): string {
  return `M${p(CX - hem, len - depth)} L${p(CX + hem, len - depth)} L${p(CX + hem, len)} Q${p(CX, len + 5)} ${p(CX - hem, len)} Z`;
}
