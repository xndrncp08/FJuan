/**
 * SeasonSelector – Season year picker.
 * Styled to match the app's dark F1 theme.
 */

import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SeasonSelectorProps {
  season: string;
  onSeasonChange: (season: string) => void;
}

export default function SeasonSelector({ season, onSeasonChange }: SeasonSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "1rem",
      padding: "1rem 0", marginBottom: "1.5rem",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Left: label + count */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
        <h2 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
          textTransform: "uppercase", color: "white",
          margin: 0, letterSpacing: "-0.01em",
        }}>
          {season} Season
        </h2>
        <span className="data-readout" style={{ fontSize: "0.55rem" }}>
          Race Calendar
        </span>
      </div>

      {/* Right: dropdown */}
      <Select value={season} onValueChange={onSeasonChange}>
        <SelectTrigger style={{
          height: "36px", width: "160px",
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: "0.8rem", letterSpacing: "0.08em",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white", borderRadius: 0,
        }}>
          <SelectValue placeholder="Season" />
        </SelectTrigger>
        <SelectContent style={{
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 0, maxHeight: "360px",
        }}>
          {years.map((year) => (
            <SelectItem
              key={year} value={year}
              style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: "0.85rem", color: "white",
              }}
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}