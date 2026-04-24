import { DriverStats } from "@/lib/types/driver";
import { TEAM_COLORS, D1_COLOR, D2_COLOR } from "./constants";

interface DriverBannerProps {
  d1: DriverStats;
  d2: DriverStats;
  team1: string;
  team2: string;
}

export function DriverBanner({ d1, d2, team1, team2 }: DriverBannerProps) {
  const t1Color = TEAM_COLORS[team1] ?? D1_COLOR;
  const t2Color = TEAM_COLORS[team2] ?? D2_COLOR;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto 1fr",
      gap: "1px", background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.07)",
      marginBottom: "1px",
      animation: "compareSlideUp 0.65s 0.05s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Driver 1 */}
      <DriverCard
        stats={d1}
        team={team1}
        teamColor={t1Color}
        accentColor={D1_COLOR}
        label="Driver 01"
        labelColor={D1_COLOR}
        labelBg="rgba(225,6,0,0.08)"
        labelBorder="rgba(225,6,0,0.2)"
        borderTop={`3px solid ${D1_COLOR}`}
        ghostNumberSide="right"
        ghostNumberStroke="rgba(225,6,0,0.07)"
      />

      {/* VS centre */}
      <div style={{
        background: "#060606",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 clamp(0.75rem,2vw,1.5rem)",
      }}>
        <div style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(0.9rem,2vw,1.2rem)",
          color: "rgba(255,255,255,0.08)",
          letterSpacing: "0.06em",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}>
          VS
        </div>
      </div>

      {/* Driver 2 */}
      <DriverCard
        stats={d2}
        team={team2}
        teamColor={t2Color}
        accentColor="rgba(255,255,255,0.4)"
        label="Driver 02"
        labelColor="rgba(255,255,255,0.4)"
        labelBg="rgba(255,255,255,0.04)"
        labelBorder="rgba(255,255,255,0.1)"
        borderTop="3px solid rgba(255,255,255,0.35)"
        ghostNumberSide="left"
        ghostNumberStroke="rgba(255,255,255,0.04)"
      />
    </div>
  );
}

// ─── Internal sub-component ───────────────────────────────────────────────────
interface DriverCardProps {
  stats: DriverStats;
  team: string;
  teamColor: string;
  accentColor: string;
  label: string;
  labelColor: string;
  labelBg: string;
  labelBorder: string;
  borderTop: string;
  ghostNumberSide: "left" | "right";
  ghostNumberStroke: string;
}

function DriverCard({
  stats, team, teamColor, accentColor,
  label, labelColor, labelBg, labelBorder,
  borderTop, ghostNumberSide, ghostNumberStroke,
}: DriverCardProps) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#0a0a0a",
      borderTop,
      padding: "clamp(1.25rem,3vw,2rem)",
    }}>
      {/* Ghost number */}
      <div style={{
        position: "absolute",
        [ghostNumberSide]: "-4%",
        top: "50%",
        transform: "translateY(-50%)",
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(5rem,14vw,10rem)",
        color: "transparent",
        WebkitTextStroke: `1px ${ghostNumberStroke}`,
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
      }}>
        {stats.driver.permanentNumber || (ghostNumberSide === "right" ? "1" : "2")}
      </div>

      {/* Label badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        padding: "0.2rem 0.55rem", marginBottom: "1rem",
        background: labelBg,
        border: `1px solid ${labelBorder}`,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
          fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: labelColor,
        }}>{label}</span>
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
        fontSize: "clamp(0.7rem,1.5vw,0.85rem)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        color: "rgba(255,255,255,0.3)", marginBottom: "2px",
      }}>
        {stats.driver.givenName}
      </div>
      <div style={{
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(1.6rem,4vw,3rem)",
        textTransform: "uppercase", letterSpacing: "-0.02em",
        color: "white", lineHeight: 0.95, marginBottom: "0.6rem",
      }}>
        {stats.driver.familyName}
      </div>

      {/* Team */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: teamColor, flexShrink: 0 }} />
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: "0.68rem", letterSpacing: "0.1em",
          textTransform: "uppercase", color: teamColor,
        }}>
          {team}
        </span>
      </div>

      {/* Meta chips */}
      <div style={{ display: "flex", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
        {[
          { label: "Nationality",    value: stats.driver.nationality },
          { label: "Championships",  value: stats.totalChampionships },
          { label: "Career Span",    value: `${stats.careerSpan.yearsActive}yr` },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, background: "#060606", padding: "0.6rem 0.75rem" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem",
              color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: "2px",
            }}>{item.label}</div>
            <div style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(0.7rem,1.5vw,0.85rem)",
              color: "rgba(255,255,255,0.7)",
            }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}