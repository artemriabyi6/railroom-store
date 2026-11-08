export const SIZES = ["S", "M", "L", "XL", "2XL"] as const;
export type Size = (typeof SIZES)[number];

export type TopKind = "tee" | "shirt" | "overshirt" | "hoodie" | "zipHoodie" | "jacket" | "track" | "vest";
export type BottomKind = "trousers" | "shorts";
export type GarmentKind = TopKind | BottomKind;

export const isBottomKind = (kind: GarmentKind): kind is BottomKind => kind === "trousers" || kind === "shorts";

export type FabricPattern =
  | { type: "solid" }
  | { type: "plaid"; band: string; line: string }
  | { type: "stripe"; stripe: string; width?: number }
  | { type: "rib"; line?: string };

/** A decorative colour-blocked panel drawn on top of the garment body. */
export interface GarmentPanel {
  side: "front" | "back";
  /** Panel path in the 240x300 garment coordinate space. */
  path: string;
  fill: string;
  piping?: string;
}

export interface GarmentArtwork {
  kind: GarmentKind;
  base: string;
  pattern: FabricPattern;
  /** Sleeve length for shirts and tees. Jackets, hoodies and overshirts are always long. */
  sleeves?: "short" | "long";
  /** Colour for collars, cuffs, ribbing, waistbands, etc. Defaults to a shade of `base`. */
  trim?: string;
  /** Hardware (buttons, zips). */
  hardware?: string;
  panels?: GarmentPanel[];
  /** Coloured stripes along the sleeves (track tops) or outer leg (bottoms). */
  sleeveStripe?: string;
  /** Small text printed on the back. */
  backPrint?: string;
  /** Bottoms: elastic drawcord waist instead of a button waistband. */
  drawcord?: boolean;
  /** Bottoms: side cargo pockets. */
  cargo?: boolean;
}

export type ProductCategory = "shirts" | "outerwear" | "hoodies" | "tops" | "bottoms";

export interface Product {
  slug: string;
  name: string;
  colorName: string;
  category: ProductCategory;
  /** Base price in euro cents. */
  priceEur: number;
  description: string;
  details: string[];
  stock: Record<Size, number>;
  art: GarmentArtwork;
  /** Hangs on the homepage hero rail. */
  rail?: boolean;
  /** Part of the latest drop. */
  isNew?: boolean;
}
