"use client";

import { Dialog } from "@/components/ui/Dialog";
import { stockLevel } from "@/lib/catalog";
import { SIZES, type Product, type Size } from "@/types/product";
import styles from "./AvailabilityDialog.module.scss";

/** Garment measurements in cm (chest width laid flat / back length). */
const TOP_MEASUREMENTS: Record<Size, [number, number]> = {
  S: [56, 68],
  M: [59, 70],
  L: [62, 72],
  XL: [65, 74],
  "2XL": [68, 76],
};

/** Bottoms: waist (flat, cm) / inseam (cm). */
const BOTTOM_MEASUREMENTS: Record<Size, [number, number]> = {
  S: [38, 78],
  M: [41, 80],
  L: [44, 81],
  XL: [47, 82],
  "2XL": [50, 83],
};

const LABEL = { out: "Sold out", low: "Low stock", in: "In stock" } as const;

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  onPickSize: (size: Size) => void;
}

export function AvailabilityDialog({ product, open, onClose, onPickSize }: Props) {
  const bottoms = product.category === "bottoms";
  const measurements = bottoms ? BOTTOM_MEASUREMENTS : TOP_MEASUREMENTS;
  return (
    <Dialog open={open} onClose={onClose} title="Size availability">
      <p className={styles.lead}>
        {product.name} — {product.colorName}
      </p>
      <table className={styles.table}>
        <caption className="visually-hidden">Stock and measurements by size</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">{bottoms ? "Waist" : "Chest"}</th>
            <th scope="col">{bottoms ? "Inseam" : "Length"}</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size) => {
            const level = stockLevel(product, size);
            return (
              <tr key={size}>
                <th scope="row">{size}</th>
                <td>{measurements[size][0]} cm</td>
                <td>{measurements[size][1]} cm</td>
                <td>
                  {level === "out" ? (
                    <span className={styles.status} data-level={level}>
                      {LABEL[level]}
                    </span>
                  ) : (
                    <button type="button" className={styles.pick} data-level={level} onClick={() => onPickSize(size)}>
                      {level === "low" ? `Only ${product.stock[size]} left` : LABEL[level]} · Select
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.note}>Measurements are taken flat and may vary by ±1 cm. Stock updates in real time at checkout.</p>
    </Dialog>
  );
}
