import { FabricDefs, isDark, OUTLINE, SEAM, shade } from "./fabric";
import type { GarmentArtProps } from "./GarmentArt";
import { CX, mirror, p, VIEW_H, VIEW_W } from "./geometry";

/** Trousers and shorts, hung by the waistband from a clip hanger. Same 240x300 space as tops. */
const WAIST_TOP = 46;
const WAIST_H = 12;
const HALF = 47;

function legsPath(shorts: boolean): string {
  const w = WAIST_TOP + WAIST_H;
  if (shorts) {
    return `M${p(CX - HALF, w)} L${p(CX + HALF, w)} L${p(CX + HALF + 12, 178)} L${p(CX + 5, 182)} L${p(CX, 122)} L${p(CX - 5, 182)} L${p(CX - HALF - 12, 178)} Z`;
  }
  return `M${p(CX - HALF, w)} L${p(CX + HALF, w)} L${p(CX + HALF + 7, 292)} L${p(CX + 7, 292)} L${p(CX, 128)} L${p(CX - 7, 292)} L${p(CX - HALF - 7, 292)} Z`;
}

export function BottomsArt({ art, view = "front", uid, label, className, showHanger = true }: GarmentArtProps) {
  const shorts = art.kind === "shorts";
  const front = view === "front";
  const fabric = `${uid}-fab`;
  const clip = `${uid}-clip`;
  const shadeId = `${uid}-shade`;
  const trim = art.trim ?? shade(art.base, -0.12);
  const hardware = art.hardware ?? "#c9c9c9";
  const dark = isDark(art.base);
  const fold = dark ? "rgb(255 255 255 / 0.08)" : "rgb(0 0 0 / 0.08)";
  const legs = legsPath(shorts);
  const hemY = shorts ? 178 : 290;
  const waistBottom = WAIST_TOP + WAIST_H;
  const waist = `M${p(CX - HALF - 1, WAIST_TOP)} L${p(CX + HALF + 1, WAIST_TOP)} L${p(CX + HALF, waistBottom)} L${p(CX - HALF, waistBottom)} Z`;
  const pocketL = `M${p(CX - HALF + 2, waistBottom + 2)} Q${p(CX - HALF + 16, waistBottom + 22)} ${p(CX - HALF + 1, waistBottom + 40)}`;
  const crease = shorts ? `M${p(CX - 26, 128)} L${p(CX - 28, 176)}` : `M${p(CX - 26, 128)} L${p(CX - 30, 288)}`;
  const stripe = `M${p(CX - HALF - 1, waistBottom + 1)} L${p(CX - HALF - (shorts ? 11 : 6), hemY - 2)}`;

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
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={legs} />
          <path d={waist} />
        </clipPath>
      </defs>

      {showHanger && (
        <g>
          <path
            d={`M${p(CX, 34)} L${p(CX, 24)} C${p(CX, 14)} ${p(CX + 10, 14)} ${p(CX + 10, 7)} C${p(CX + 10, 1)} ${p(CX + 2, 0)} ${p(CX - 4, 4)}`}
            fill="none"
            stroke="#9b9b9b"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <rect x={CX - 62} y="32" width="124" height="5" rx="2.5" fill="#8e8e8e" />
          <rect x={CX - 44} y="33" width="10" height="20" rx="1.5" fill="#4a4a4a" />
          <rect x={CX + 34} y="33" width="10" height="20" rx="1.5" fill="#4a4a4a" />
        </g>
      )}

      <path d={legs} fill={`url(#${fabric})`} stroke={OUTLINE} />

      {art.sleeveStripe && (
        <g stroke={art.sleeveStripe} strokeWidth="3" strokeLinecap="round">
          <path d={stripe} />
          <path d={mirror(stripe)} />
        </g>
      )}

      {/* Waistband */}
      <path d={waist} fill={art.drawcord ? trim : `url(#${fabric})`} stroke={OUTLINE} />
      {art.drawcord ? (
        <g>
          <g stroke="rgb(0 0 0 / 0.1)" strokeWidth="1">
            {Array.from({ length: 23 }, (_, i) => (
              <path key={i} d={`M${p(CX - HALF + 2 + i * 4.1, WAIST_TOP + 1)} L${p(CX - HALF + 2 + i * 4.1, waistBottom - 1)}`} />
            ))}
          </g>
          {front && (
            <g stroke={hardware === "#c9c9c9" ? "#f2f2f2" : hardware} strokeWidth="2" strokeLinecap="round" fill="none">
              <path d={`M${p(CX - 5, waistBottom - 2)} Q${p(CX - 8, waistBottom + 16)} ${p(CX - 6, waistBottom + 30)}`} />
              <path d={`M${p(CX + 5, waistBottom - 2)} Q${p(CX + 9, waistBottom + 14)} ${p(CX + 7, waistBottom + 28)}`} />
            </g>
          )}
        </g>
      ) : (
        <g fill={`url(#${fabric})`} stroke={OUTLINE} strokeWidth="0.8">
          {[-34, -12, 12, 34].map((x) => (
            <rect key={x} x={CX + x - 2.5} y={WAIST_TOP - 1} width="5" height={WAIST_H + 3} rx="1" />
          ))}
        </g>
      )}

      {front ? (
        <g fill="none" stroke={SEAM} strokeWidth="1.1">
          {!art.drawcord && (
            <>
              <circle cx={CX} cy={WAIST_TOP + WAIST_H / 2} r="2.6" fill={hardware} stroke={OUTLINE} strokeWidth="0.6" />
              <path d={`M${p(CX + 7, waistBottom)} L${p(CX + 7, waistBottom + 40)} Q${p(CX + 7, waistBottom + 50)} ${p(CX, waistBottom + 54)}`} />
            </>
          )}
          <path d={`M${p(CX, waistBottom)} L${p(CX, waistBottom + 60)}`} />
          <path d={pocketL} />
          <path d={mirror(pocketL)} />
        </g>
      ) : (
        <g fill="none" stroke={SEAM} strokeWidth="1.1">
          <path d={`M${p(CX - HALF, waistBottom + 12)} Q${p(CX, waistBottom + 22)} ${p(CX + HALF, waistBottom + 12)}`} />
          <path d={`M${p(CX, waistBottom)} L${p(CX, waistBottom + 62)}`} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${p(CX + s * 12, waistBottom + 22)} L${p(CX + s * 36, waistBottom + 20)} L${p(CX + s * 35, waistBottom + 46)} L${p(CX + s * 24, waistBottom + 50)} L${p(CX + s * 13, waistBottom + 46)} Z`} />
              <path d={`M${p(CX + s * 12, waistBottom + 28)} L${p(CX + s * 36, waistBottom + 26)}`} />
            </g>
          ))}
        </g>
      )}

      {art.cargo && (
        <g fill={`url(#${fabric})`} stroke={OUTLINE} strokeWidth="0.9">
          {[-1, 1].map((s) => {
            const x = s < 0 ? CX - HALF - 6 : CX + HALF + 6 - 26;
            const y = shorts ? 120 : 160;
            return (
              <g key={s}>
                <rect x={x} y={y} width="26" height="34" rx="2" />
                <rect x={x - 1} y={y - 2} width="28" height="10" rx="2" />
              </g>
            );
          })}
        </g>
      )}

      {/* Creases, folds and hems */}
      <g fill="none" stroke={fold} strokeWidth="2.2" strokeLinecap="round">
        <path d={crease} />
        <path d={mirror(crease)} />
      </g>
      <g stroke={SEAM} strokeWidth="1">
        <path d={`M${p(CX - HALF - (shorts ? 11 : 6.5), hemY - 8)} L${p(CX - 6, hemY - 6)}`} />
        <path d={mirror(`M${p(CX - HALF - (shorts ? 11 : 6.5), hemY - 8)} L${p(CX - 6, hemY - 6)}`)} />
      </g>

      <g clipPath={`url(#${clip})`} style={{ mixBlendMode: "multiply" }}>
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill={`url(#${shadeId})`} />
      </g>

      {!front && art.backPrint && (
        <text x={CX + 24} y={waistBottom + 74} textAnchor="middle" fontSize="7" fontWeight="800" letterSpacing="1.5" fill={dark ? "#f2f2f2" : "#1a1a1a"} fontFamily="Arial, sans-serif">
          {art.backPrint}
        </text>
      )}
    </svg>
  );
}
