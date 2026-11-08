import type { CurrencyCode } from "@/types/commerce";

/** Simplified flags for the currency selector (emoji flags don't render on Windows). */
export function Flag({ code, className }: { code: CurrencyCode; className?: string }) {
  const common = { viewBox: "0 0 18 12", className, "aria-hidden": true as const, focusable: "false" as const };
  switch (code) {
    case "EUR":
      return (
        <svg {...common}>
          <rect width="18" height="12" fill="#1f4bb3" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            // Round so server and client produce identical attribute strings.
            const cx = Math.round((9 + Math.cos(a) * 3.6) * 100) / 100;
            const cy = Math.round((6 + Math.sin(a) * 3.6) * 100) / 100;
            return <circle key={i} cx={cx} cy={cy} r="0.55" fill="#ffd400" />;
          })}
        </svg>
      );
    case "USD":
      return (
        <svg {...common}>
          <rect width="18" height="12" fill="#fff" />
          {[0, 2, 4, 6, 8, 10].map((y) => (
            <rect key={y} y={y} width="18" height="1" fill="#c8102e" />
          ))}
          <rect width="8" height="6" fill="#0a3161" />
        </svg>
      );
    case "GBP":
      return (
        <svg {...common}>
          <rect width="18" height="12" fill="#012169" />
          <path d="M0 0 18 12M18 0 0 12" stroke="#fff" strokeWidth="2.4" />
          <path d="M0 0 18 12M18 0 0 12" stroke="#c8102e" strokeWidth="0.9" />
          <path d="M9 0v12M0 6h18" stroke="#fff" strokeWidth="3.6" />
          <path d="M9 0v12M0 6h18" stroke="#c8102e" strokeWidth="2" />
        </svg>
      );
    case "NGN":
      return (
        <svg {...common}>
          <rect width="18" height="12" fill="#fff" />
          <rect width="6" height="12" fill="#008751" />
          <rect x="12" width="6" height="12" fill="#008751" />
        </svg>
      );
  }
}
