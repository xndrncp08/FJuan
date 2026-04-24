import { formatPercentage } from "@/lib/utils/format";
import { D1_COLOR, D2_COLOR } from "./constants";

interface StatBattleRowProps {
  label: string;
  d1: number;
  d2: number;
  isPercentage?: boolean;
  isAverage?: boolean;
  index: number;
}

export function StatBattleRow({
  label, d1, d2, isPercentage, isAverage, index,
}: StatBattleRowProps) {
  const total = d1 + d2;
  let pct1 = total > 0 ? (d1 / total) * 100 : 50;
  let pct2 = total > 0 ? (d2 / total) * 100 : 50;
  if (isAverage) { [pct1, pct2] = [pct2, pct1]; } // lower avg = better

  const d1Leads = pct1 > pct2;

  const fmt = (v: number) => {
    if (isPercentage) return formatPercentage(v);
    if (isAverage) return v.toFixed(1);
    return Math.round(v).toLocaleString();
  };

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      animation: `compareSlideUp 0.45s ${Math.min(index * 0.04, 0.5)}s cubic-bezier(0.16,1,0.3,1) both`,
    }}>
      {/* Stat label */}
      <div style={{
        padding: "0.85rem clamp(1rem,3vw,1.75rem) 0",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
          fontWeight: 500, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
        }}>
          {label}
        </span>
      </div>

      {/* Battle bar row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "clamp(3rem,10vw,5rem) 1fr clamp(3rem,10vw,5rem)",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem clamp(1rem,3vw,1.75rem) 0.85rem",
      }}>
        {/* D1 value */}
        <div style={{ textAlign: "right" }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.1rem,3vw,1.6rem)",
            color: d1Leads ? D1_COLOR : "rgba(255,255,255,0.4)",
            lineHeight: 1, letterSpacing: "-0.02em",
            transition: "color 0.3s ease",
          }}>
            {fmt(d1)}
          </span>
        </div>

        {/* Bar */}
        <div style={{ height: "28px", display: "flex", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* D1 side */}
          <div style={{
            width: `${pct1}%`,
            background: d1Leads
              ? `linear-gradient(90deg, #8b0000, ${D1_COLOR})`
              : "linear-gradient(90deg, #2a0000, rgba(225,6,0,0.3))",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: "6px",
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1), background 0.3s ease",
            flexShrink: 0,
          }}>
            {pct1 > 22 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                fontWeight: 500, color: "rgba(255,255,255,0.7)",
              }}>
                {pct1.toFixed(0)}%
              </span>
            )}
          </div>
          {/* D2 side */}
          <div style={{
            width: `${pct2}%`,
            background: !d1Leads
              ? "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.75))"
              : "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.2))",
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            paddingLeft: "6px",
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1), background 0.3s ease",
            flexShrink: 0,
          }}>
            {pct2 > 22 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                fontWeight: 500, color: "rgba(0,0,0,0.5)",
              }}>
                {pct2.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* D2 value */}
        <div style={{ textAlign: "left" }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.1rem,3vw,1.6rem)",
            color: !d1Leads ? D2_COLOR : "rgba(255,255,255,0.3)",
            lineHeight: 1, letterSpacing: "-0.02em",
            transition: "color 0.3s ease",
          }}>
            {fmt(d2)}
          </span>
        </div>
      </div>
    </div>
  );
}