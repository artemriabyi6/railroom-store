import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} | ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SWATCHES = ["#d9c47f", "#c7342c", "#e2582a", "#283350", "#1f9e63", "#ebe7df", "#1d1d1f", "#6d93c8", "#f5f4f0"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f3f1" }}>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: 6, color: "#111" }}>{siteConfig.name}</div>
        <div style={{ display: "flex", marginTop: 56, position: "relative", width: 760, height: 220, justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 760, height: 8, borderRadius: 4, background: "#9a9a9a" }} />
          {SWATCHES.map((c) => (
            <div key={c} style={{ display: "flex", width: 58, height: 200, marginTop: 14, marginLeft: 12, marginRight: 12, borderRadius: 8, background: c, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }} />
          ))}
        </div>
        <div style={{ marginTop: 40, fontSize: 26, letterSpacing: 8, color: "#6b6b6b", textTransform: "uppercase" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
