"use client";

import { useId } from "react";
import { isBottomKind, type GarmentArtwork, type TopKind } from "@/types/product";
import {
  CX,
  cuffPath,
  dimsFor,
  hemBandPath,
  mirror,
  p,
  sleeveHemLine,
  sleevePath,
  torsoPath,
  VIEW_H,
  VIEW_W,
  type Dims,
} from "./geometry";
import { BottomsArt } from "./BottomsArt";
import { FabricDefs, isDark, OUTLINE, SEAM, shade } from "./fabric";

type TopArtwork = GarmentArtwork & { kind: TopKind };

export type GarmentView = "front" | "back";

export interface GarmentArtProps {
  art: GarmentArtwork;
  view?: GarmentView;
  /** Unique id prefix for SVG defs (patterns, gradients, clip paths). */
  uid: string;
  /** Accessible label; when omitted the graphic is decorative. */
  label?: string;
  className?: string;
  showHanger?: boolean;
}


function Buttons({ from, to, step, color, x = CX }: { from: number; to: number; step: number; color: string; x?: number }) {
  const ys: number[] = [];
  for (let y = from; y <= to; y += step) ys.push(y);
  return (
    <g>
      {ys.map((y) => (
        <circle key={y} cx={x} cy={y} r="2.4" fill={color} stroke={OUTLINE} strokeWidth="0.6" />
      ))}
    </g>
  );
}

function Pocket({ x, y, w, h, flap, fill }: { x: number; y: number; w: number; h: number; flap?: boolean; fill: string }) {
  return (
    <g fill="none" stroke={SEAM} strokeWidth="1">
      <path d={`M${p(x, y)} L${p(x + w, y)} L${p(x + w, y + h - 4)} L${p(x + w / 2, y + h)} L${p(x, y + h - 4)} Z`} fill={fill} />
      {flap && <path d={`M${p(x - 1, y - 1)} L${p(x + w + 1, y - 1)} L${p(x + w + 1, y + 9)} L${p(x - 1, y + 9)} Z`} fill={fill} />}
    </g>
  );
}

function Hood({ d, view, inner, fill }: { d: Dims; view: "front" | "back"; inner: string; fill: string }) {
  const { sy } = d;
  if (view === "front") {
    return (
      <g>
        <path
          d={`M${p(CX - 32, sy + 6)} Q${p(CX - 38, sy - 34)} ${p(CX, sy - 38)} Q${p(CX + 38, sy - 34)} ${p(CX + 32, sy + 6)} Z`}
          fill={fill}
          stroke={OUTLINE}
        />
        <path
          d={`M${p(CX - 24, sy + 2)} Q${p(CX - 26, sy - 26)} ${p(CX, sy - 28)} Q${p(CX + 26, sy - 26)} ${p(CX + 24, sy + 2)} Q${p(CX, sy + 30)} ${p(CX - 24, sy + 2)} Z`}
          fill={inner}
        />
      </g>
    );
  }
  return null;
}

/**
 * Renders a garment illustration. A per-instance React id is appended to `uid` so SVG
 * pattern/gradient/clip ids stay unique even when the same product renders several
 * times (e.g. a hidden, preserved route alongside the visible one).
 */
export function GarmentArt(props: GarmentArtProps) {
  const instanceId = useId();
  const uid = `${props.uid}${instanceId}`;
  const { art } = props;
  if (isBottomKind(art.kind)) return <BottomsArt {...props} uid={uid} />;
  return <TopArt {...props} uid={uid} art={art as TopArtwork} />;
}

function TopArt({ art, view = "front", uid, label, className, showHanger = true }: GarmentArtProps & { art: TopArtwork }) {
  const d = dimsFor(art);
  const { sy, len, half } = d;
  const fabric = `${uid}-fab`;
  const clip = `${uid}-clip`;
  const shadeId = `${uid}-shade`;
  const trim = art.trim ?? shade(art.base, -0.12);
  const hardware = art.hardware ?? "#d8d8d8";
  const dark = isDark(art.base);
  const fold = dark ? "rgb(255 255 255 / 0.07)" : "rgb(0 0 0 / 0.07)";
  const inner = shade(art.base, dark ? 0.12 : -0.16);
  const isHood = art.kind === "hoodie" || art.kind === "zipHoodie";
  const front = view === "front";

  const torso = torsoPath(art.kind, d);
  const sleeveL = sleevePath(d);
  const sleeveR = sleeveL ? mirror(sleeveL) : null;
  const cuffL = cuffPath(d, art.kind === "overshirt" || art.kind === "shirt" ? 18 : 14);
  const panels = (art.panels ?? []).filter((pl) => pl.side === view);
  const hasRibHem = isHood || art.kind === "track" || art.kind === "vest" || art.kind === "jacket";
  const opening = art.kind === "zipHoodie" || art.kind === "track" || art.kind === "jacket";

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <FabricDefs art={art} id={fabric} />
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={torso} />
          {sleeveL && <path d={sleeveL} />}
          {sleeveR && <path d={sleeveR} />}
        </clipPath>
      </defs>

      {showHanger && (
        <g>
          <path
            d={`M${p(CX, sy - 10)} L${p(CX, 24)} C${p(CX, 14)} ${p(CX + 10, 14)} ${p(CX + 10, 7)} C${p(CX + 10, 1)} ${p(CX + 2, 0)} ${p(CX - 4, 4)}`}
            fill="none"
            stroke="#9b9b9b"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d={`M${p(CX - half + 6, sy + 8)} L${p(CX, sy - 12)} L${p(CX + half - 6, sy + 8)}`}
            fill="none"
            stroke="#7c5034"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {isHood && front && <Hood d={d} view="front" inner={inner} fill={`url(#${fabric})`} />}

      {/* Sleeves sit behind the body */}
      {sleeveL && <path d={sleeveL} fill={`url(#${fabric})`} stroke={OUTLINE} />}
      {sleeveR && <path d={sleeveR} fill={`url(#${fabric})`} stroke={OUTLINE} />}
      {cuffL && (
        <g fill={art.kind === "shirt" || art.kind === "overshirt" ? `url(#${fabric})` : trim} stroke={OUTLINE} strokeWidth="0.8">
          <path d={cuffL} />
          <path d={mirror(cuffL)} />
        </g>
      )}
      {d.sleeves === "short" && (
        <g stroke={SEAM} strokeWidth="1">
          <path d={sleeveHemLine(d)} />
          <path d={mirror(sleeveHemLine(d))} />
        </g>
      )}

      <path d={torso} fill={`url(#${fabric})`} stroke={OUTLINE} />

      {/* Colour-blocked panels clipped to the garment silhouette */}
      {panels.length > 0 && (
        <g clipPath={`url(#${clip})`}>
          {panels.map((pl, i) => (
            <path key={i} d={pl.path} fill={pl.fill} stroke={pl.piping} strokeWidth={pl.piping ? 3 : 0} strokeLinejoin="round" />
          ))}
        </g>
      )}

      {/* Track-top sleeve stripes */}
      {art.sleeveStripe && sleeveL && (
        <g fill="none" stroke={art.sleeveStripe} strokeWidth="2.6" strokeLinecap="round">
          {[0, 5].map((o) => {
            const x = CX - half;
            const s = `M${p(x + 2 - o * 0.4, sy + 8 + o)} C${p(x - 14 - o * 0.3, sy + 18)} ${p(x - 17 + o * 0.6, sy + 50)} ${p(x - 17 + o * 0.6, sy + 80)} L${p(x - 15 + o * 0.6, len - 26)}`;
            return (
              <g key={o}>
                <path d={s} />
                <path d={mirror(s)} />
              </g>
            );
          })}
        </g>
      )}

      {/* Folds */}
      <g fill="none" stroke={fold} strokeWidth="2.4" strokeLinecap="round">
        <path d={`M${p(CX - 22, sy + 60)} Q${p(CX - 28, sy + 120)} ${p(CX - 20, len - 18)}`} />
        <path d={`M${p(CX + 26, sy + 80)} Q${p(CX + 30, sy + 140)} ${p(CX + 24, len - 24)}`} />
      </g>

      {hasRibHem && (
        <path d={hemBandPath(d, art.kind === "jacket" ? 12 : 16)} fill={art.kind === "jacket" ? `url(#${fabric})` : trim} stroke={OUTLINE} strokeWidth="0.8" />
      )}

      {/* Neckline / collars */}
      {(art.kind === "tee" || art.kind === "vest") && front && (
        <path
          d={art.kind === "vest" ? `M${p(CX - 15, sy - 6)} L${p(CX, sy + 52)} L${p(CX + 15, sy - 6)}` : `M${p(CX - 15, sy - 6)} Q${p(CX, sy + 8)} ${p(CX + 15, sy - 6)}`}
          fill="none"
          stroke={trim}
          strokeWidth={art.kind === "vest" ? 7 : 4.5}
          strokeLinejoin="round"
        />
      )}
      {art.kind === "vest" && (
        <g fill="none" stroke={trim} strokeWidth="5">
          <path d={`M${p(CX - half + 16, sy + 2)} Q${p(CX - half + 16, sy + 44)} ${p(CX - half, sy + 62)}`} />
          <path d={mirror(`M${p(CX - half + 16, sy + 2)} Q${p(CX - half + 16, sy + 44)} ${p(CX - half, sy + 62)}`)} />
        </g>
      )}
      {(art.kind === "tee" || art.kind === "vest") && !front && (
        <path d={`M${p(CX - 15, sy - 6)} Q${p(CX, sy - 2)} ${p(CX + 15, sy - 6)}`} fill="none" stroke={trim} strokeWidth="4" />
      )}

      {(art.kind === "shirt" || art.kind === "overshirt") &&
        (front ? (
          <g>
            <rect x={CX - 4.5} y={sy + 4} width="9" height={len - sy - 2} fill="none" stroke={SEAM} />
            <Buttons from={sy + 14} to={len - 16} step={art.kind === "overshirt" ? 30 : 26} color={hardware} />
            <path d={`M${p(CX, sy + 10)} L${p(CX - 16, sy - 8)} L${p(CX - 26, sy + 6)} L${p(CX - 5, sy + 22)} Z`} fill={`url(#${fabric})`} stroke={OUTLINE} />
            <path d={mirror(`M${p(CX, sy + 10)} L${p(CX - 16, sy - 8)} L${p(CX - 26, sy + 6)} L${p(CX - 5, sy + 22)} Z`)} fill={`url(#${fabric})`} stroke={OUTLINE} />
            {art.kind === "overshirt" ? (
              <>
                <Pocket x={CX - 40} y={sy + 34} w={26} h={30} flap fill={`url(#${fabric})`} />
                <Pocket x={CX + 14} y={sy + 34} w={26} h={30} flap fill={`url(#${fabric})`} />
              </>
            ) : (
              !art.panels && <Pocket x={CX + 14} y={sy + 34} w={24} h={26} fill={`url(#${fabric})`} />
            )}
          </g>
        ) : (
          <g>
            <path d={`M${p(CX - 18, sy - 8)} Q${p(CX, sy - 13)} ${p(CX + 18, sy - 8)} L${p(CX + 20, sy + 1)} Q${p(CX, sy - 3)} ${p(CX - 20, sy + 1)} Z`} fill={`url(#${fabric})`} stroke={OUTLINE} />
            <path d={`M${p(CX - half + 2, sy + 34)} Q${p(CX, sy + 42)} ${p(CX + half - 2, sy + 34)}`} fill="none" stroke={SEAM} />
            <path d={`M${p(CX - 4, sy + 37)} L${p(CX - 4, sy + 52)} M${p(CX + 4, sy + 37)} L${p(CX + 4, sy + 52)}`} stroke={SEAM} />
          </g>
        ))}

      {art.kind === "jacket" && (
        <g>
          {front ? (
            <>
              <path d={`M${p(CX + 1.5, sy + 26)} L${p(CX + 1.5, len)}`} stroke={SEAM} strokeWidth="1.4" />
              <Buttons from={sy + 34} to={len - 22} step={34} color={hardware} x={CX - 6} />
              <Pocket x={CX - 44} y={sy + 34} w={28} h={28} flap fill={`url(#${fabric})`} />
              <Pocket x={CX + 16} y={sy + 34} w={28} h={28} flap fill={`url(#${fabric})`} />
              <Pocket x={CX - 48} y={sy + 112} w={34} h={42} fill={`url(#${fabric})`} />
              <Pocket x={CX + 14} y={sy + 112} w={34} h={42} fill={`url(#${fabric})`} />
              <path d={`M${p(CX + 1, sy + 28)} L${p(CX - 16, sy - 8)} L${p(CX - 36, sy + 4)} L${p(CX - 10, sy + 42)} Z`} fill={trim} stroke={OUTLINE} />
              <path d={mirror(`M${p(CX - 1, sy + 28)} L${p(CX - 16, sy - 8)} L${p(CX - 36, sy + 4)} L${p(CX - 10, sy + 42)} Z`)} fill={trim} stroke={OUTLINE} />
            </>
          ) : (
            <>
              <path d={`M${p(CX - 30, sy - 8)} Q${p(CX, sy - 14)} ${p(CX + 30, sy - 8)} L${p(CX + 32, sy + 6)} Q${p(CX, sy)} ${p(CX - 32, sy + 6)} Z`} fill={trim} stroke={OUTLINE} />
              <path d={`M${p(CX - half + 2, sy + 44)} Q${p(CX, sy + 52)} ${p(CX + half - 2, sy + 44)}`} fill="none" stroke={SEAM} />
            </>
          )}
        </g>
      )}

      {art.kind === "track" && (
        <g>
          <path d={`M${p(CX - 18, sy - 12)} L${p(CX + 18, sy - 12)} L${p(CX + 20, sy + 6)} Q${p(CX, sy + 10)} ${p(CX - 20, sy + 6)} Z`} fill={trim} stroke={OUTLINE} />
          {art.sleeveStripe && <path d={`M${p(CX - 18, sy - 4)} L${p(CX + 18, sy - 4)}`} stroke={art.sleeveStripe} strokeWidth="2" />}
        </g>
      )}

      {opening && front && art.kind !== "jacket" && (
        <g>
          <path d={`M${p(CX, art.kind === "track" ? sy - 12 : sy + 4)} L${p(CX, len)}`} stroke={hardware} strokeWidth="2.2" />
          <rect x={CX - 2.5} y={art.kind === "track" ? sy - 8 : sy + 8} width="5" height="9" rx="1" fill={hardware} stroke={OUTLINE} strokeWidth="0.6" />
        </g>
      )}

      {isHood && front && (
        <g>
          <g stroke={trim} strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d={`M${p(CX - 9, sy + 14)} Q${p(CX - 12, sy + 40)} ${p(CX - 10, sy + 60)}`} />
            <path d={`M${p(CX + 9, sy + 14)} Q${p(CX + 13, sy + 38)} ${p(CX + 11, sy + 58)}`} />
          </g>
          <g fill={hardware}>
            <rect x={CX - 11.5} y={sy + 58} width="3" height="6" rx="1" />
            <rect x={CX + 9.5} y={sy + 56} width="3" height="6" rx="1" />
          </g>
          {art.kind === "hoodie" ? (
            <path d={`M${p(CX - 34, len - 76)} L${p(CX + 34, len - 76)} L${p(CX + 46, len - 22)} L${p(CX - 46, len - 22)} Z`} fill="none" stroke={SEAM} strokeWidth="1.2" />
          ) : (
            <g fill="none" stroke={SEAM} strokeWidth="1.2">
              <path d={`M${p(CX - 30, len - 72)} L${p(CX - 46, len - 22)}`} />
              <path d={`M${p(CX + 30, len - 72)} L${p(CX + 46, len - 22)}`} />
            </g>
          )}
          {art.kind === "zipHoodie" && <rect x={CX + 14} y={sy + 26} width="14" height="6" fill="#efefef" opacity="0.9" />}
        </g>
      )}

      {isHood && !front && (
        <g>
          <path
            d={`M${p(CX - 30, sy - 2)} Q${p(CX - 40, sy + 66)} ${p(CX, sy + 78)} Q${p(CX + 40, sy + 66)} ${p(CX + 30, sy - 2)} Q${p(CX, sy - 10)} ${p(CX - 30, sy - 2)} Z`}
            fill={`url(#${fabric})`}
            stroke={OUTLINE}
          />
          <path d={`M${p(CX, sy - 6)} L${p(CX, sy + 76)}`} stroke={SEAM} />
        </g>
      )}

      {/* Shading over the whole silhouette */}
      <g clipPath={`url(#${clip})`} style={{ mixBlendMode: "multiply" }}>
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill={`url(#${shadeId})`} />
      </g>

      {!front && art.backPrint && (
        <text
          x={CX}
          y={sy + 120}
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2"
          fill={dark ? "#f2f2f2" : "#1a1a1a"}
          fontFamily="Arial, sans-serif"
        >
          {art.backPrint}
        </text>
      )}

      {/* Neck label */}
      {front && !isHood && art.kind !== "track" && art.kind !== "jacket" && (
        <rect x={CX - 7} y={sy - 4} width="14" height="6" rx="0.8" fill="#fafafa" stroke={OUTLINE} strokeWidth="0.5" />
      )}
    </svg>
  );
}
