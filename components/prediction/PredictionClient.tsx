/**
 * components/prediction/PredictionClient.tsx
 *
 * v3 — threads isSprint/isWet down to all child components,
 * updates methodology section to reflect all 8 factors,
 * and adds a weather/sprint context panel above the podium grid.
 *
 * Only the changed sections are noted below. Everything else
 * (loading, error, layout) is unchanged from v2.
 */
"use client";

import { useState } from "react";
import { RacePrediction, DriverPrediction } from "@/lib/types/prediction";
import { usePrediction } from "@/lib/hooks/usePrediction";
import PredictionHero from "./PredictionHero";
import ScoreRadarChart from "./ScoreRadarChart";
import ProbabilityDistributionChart from "./ProbabilityDistributionChart";
import FactorWeightDonut from "./FactorWeightDonut";
import DriverVsFieldChart from "./DriverVsFieldChart";

interface PredictionClientProps {
  initialPrediction: RacePrediction | null;
  initialError: string | null;
}

const TEAM_COLORS: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  rb: "#6692FF",
  kick_sauber: "#52E252",
  haas: "#B6BABD",
};

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["RACE WINNER", "2ND PLACE", "3RD PLACE"];
const PAGE_BG = "#080808";

// ─── Methodology factor definitions (v3) ─────────────────────────────────────

const METHODOLOGY_FACTORS = [
  {
    weight: 35,
    label: "Recent Form",
    desc: "Recency-weighted race finishing positions across the last 5 races. Most recent race counts 3× the oldest. Mechanical DNFs carry a −2 reliability penalty; collision DNFs score 0 (not the driver's fault).",
    color: "#E10600",
  },
  {
    weight: 15,
    label: "Qualifying Pace",
    desc: "Recency-weighted qualifying positions across the same 5-race window. Pole position converts to a win ~40% of the time in modern F1 — now weighted at 15% to reflect this.",
    color: "#FF8000",
  },
  {
    weight: 15,
    label: "Championship Standing",
    desc: "Position + wins bonus (wins×0.5) after the last completed round. Two drivers tied on position are separated by win count. Snapshot taken after round N−1 to avoid future data bleed.",
    color: "#27F4D2",
  },
  {
    weight: 10,
    label: "Circuit History",
    desc: "Podium finishes at this circuit in the last 10 seasons only. All-time history is excluded — Schumacher's 5 wins at Suzuka in 2000 shouldn't influence a 2026 prediction.",
    color: "#FFD700",
  },
  {
    weight: 10,
    label: "Weather Adaptability",
    desc: "Active when rain probability exceeds 40% (via OpenMeteo forecast). Scores each driver on known wet-weather ability. On dry weekends this factor is neutral — all drivers score 50 — so it adds no noise.",
    color: "#64C4FF",
  },
  {
    weight: 7,
    label: "Sprint Form",
    desc: "Active only on sprint weekends. The sprint result is the freshest possible data point (it just happened), so it replaces the oldest race in the form window and is scored at a higher recency weight.",
    color: "#FF87BC",
  },
  {
    weight: 5,
    label: "Tyre Fit",
    desc: "Each circuit has a primary compound allocation (soft / medium / hard). Constructors are rated on their historical management of each compound. Driver tyre fit is derived from their team's rating.",
    color: "#B6BABD",
  },
  {
    weight: 3,
    label: "Grid Penalty",
    desc: "Detected via OpenF1 race control messages. A confirmed engine, gearbox, or unsafe-release penalty drops the driver's grid score to 0 (vs 100 for a clean grid). Binary and high-confidence when it applies.",
    color: "#52E252",
  },
];

// ─── Shared primitives (unchanged from v2) ────────────────────────────────────

function SkeletonBlock({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        animation: "clientPulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

function SectionHeader({
  overline,
  title,
  subtitle,
  action,
}: {
  overline: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: "2rem",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.4rem",
          }}
        >
          <div
            style={{ width: "16px", height: "2px", background: "#E10600" }}
          />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#E10600",
            }}
          >
            {overline}
          </span>
        </div>
        {title && (
          <h2
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.01em",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.25)",
              margin: "0.3rem 0 0",
              letterSpacing: "0.04em",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        padding: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  color = "white",
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "0.85rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.52rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "1.4rem",
          color,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.55rem",
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.06em",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Weekend context banner (v3 NEW) ─────────────────────────────────────────
// Shows weather forecast tiles + sprint indicator above the podium section.

function WeekendContextBanner({ prediction }: { prediction: RacePrediction }) {
  const { weather, isSprint } = prediction;
  if (!weather && !isSprint) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}
    >
      {/* Weather tile */}
      {weather && (
        <div
          style={{
            flex: "1 1 200px",
            padding: "0.85rem 1.1rem",
            background: weather.isWetExpected
              ? "rgba(100,196,255,0.05)"
              : "rgba(255,255,255,0.015)",
            border: `1px solid ${weather.isWetExpected ? "rgba(100,196,255,0.18)" : "rgba(255,255,255,0.06)"}`,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Big rain % */}
          <div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "2rem",
                color: weather.isWetExpected
                  ? "#64C4FF"
                  : "rgba(255,255,255,0.4)",
                lineHeight: 1,
              }}
            >
              {weather.rainProbability}%
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                marginTop: "2px",
              }}
            >
              Rain Probability
            </div>
          </div>
          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "36px",
              background: "rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          />
          {/* Temp + wind */}
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <div>
              <div
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1,
                }}
              >
                {Math.round(weather.temperatureC)}°C
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.48rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                  marginTop: "2px",
                }}
              >
                Temp
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1,
                }}
              >
                {Math.round(weather.windSpeedKph)}
                <span style={{ fontSize: "0.6rem" }}>km/h</span>
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.48rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                  marginTop: "2px",
                }}
              >
                Wind
              </div>
            </div>
          </div>
          {/* Wet badge */}
          {weather.isWetExpected && (
            <div
              style={{
                marginLeft: "auto",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64C4FF",
                border: "1px solid rgba(100,196,255,0.3)",
                padding: "0.3rem 0.6rem",
              }}
            >
              Wet Race Likely
            </div>
          )}
        </div>
      )}

      {/* Sprint tile */}
      {isSprint && (
        <div
          style={{
            flex: "0 1 180px",
            padding: "0.85rem 1.1rem",
            background: "rgba(255,128,0,0.05)",
            border: "1px solid rgba(255,128,0,0.18)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              color: "#FF8000",
              letterSpacing: "0.02em",
              lineHeight: 1.1,
            }}
          >
            Sprint Weekend
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.58rem",
              color: "rgba(255,255,255,0.25)",
              marginTop: "4px",
              lineHeight: 1.5,
            }}
          >
            Sprint result active in form window · Sprint shootout qualifying
            weighted separately
          </div>
        </div>
      )}
    </div>
  );
}

// ─── P1 feature card (v3 — passes isSprint/isWet to charts) ──────────────────

function P1FeatureCard({
  driver,
  allDrivers,
  isSprint,
  isWet,
}: {
  driver: DriverPrediction;
  allDrivers: DriverPrediction[];
  isSprint: boolean;
  isWet: boolean;
}) {
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";
  const rankColor = RANK_COLORS[0];

  return (
    <Panel
      style={{
        borderTop: `3px solid ${rankColor}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100px",
          background: `linear-gradient(180deg, ${rankColor}18 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Ghost number */}
      <div
        style={{
          position: "absolute",
          right: "-2%",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(6rem, 14vw, 13rem)",
          color: "transparent",
          WebkitTextStroke: `1px rgba(255,215,0,0.05)`,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        1
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          position: "relative",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "2.8rem",
                color: rankColor,
                lineHeight: 1,
              }}
            >
              P1
            </span>
            <div
              style={{
                padding: "0.18rem 0.55rem",
                border: `1px solid ${rankColor}44`,
                background: `${rankColor}0f`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.52rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: rankColor,
                  textTransform: "uppercase",
                }}
              >
                {RANK_LABELS[0]}
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              marginBottom: "0.4rem",
            }}
          >
            {driver.givenName}{" "}
            <span style={{ color: rankColor }}>{driver.familyName}</span>
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: teamColor,
            }}
          >
            {driver.constructorName}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              color: rankColor,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {driver.podiumProbability}%
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.55rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginTop: "4px",
            }}
          >
            Win Probability
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.38)",
          margin: "0 0 1.5rem",
          lineHeight: 1.6,
          fontStyle: "italic",
          position: "relative",
          maxWidth: "560px",
        }}
      >
        {driver.insight}
      </p>

      {/* Stats row — v3 includes weather + tyre */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
          gap: "2px",
          marginBottom: "1.5rem",
          position: "relative",
        }}
      >
        <StatTile
          label="Model Score"
          value={driver.score.toFixed(1)}
          color={rankColor}
          sub="out of 100"
        />
        <StatTile
          label="Recent Form"
          value={driver.factors.currentForm}
          color={teamColor}
          sub="0–100"
        />
        <StatTile
          label="Qualifying"
          value={driver.factors.qualifyingStrength}
          color={teamColor}
          sub="0–100"
        />
        <StatTile
          label="Circuit"
          value={driver.factors.circuitHistory}
          color={teamColor}
          sub="10 seasons"
        />
        <StatTile
          label="Weather"
          value={driver.factors.weatherAdaptability}
          color={isWet ? "#64C4FF" : "rgba(255,255,255,0.3)"}
          sub={isWet ? "wet active" : "dry / neutral"}
        />
        <StatTile
          label="Tyre Fit"
          value={driver.factors.tyreFit}
          color={teamColor}
          sub="compound fit"
        />
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "1.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
              marginBottom: "0.75rem",
            }}
          >
            Factor Profile
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScoreRadarChart
              driver={driver}
              accentColor={rankColor}
              isSprint={isSprint}
              isWet={isWet}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
              marginBottom: "0.75rem",
            }}
          >
            vs Field Average
          </div>
          <DriverVsFieldChart
            driver={driver}
            allDrivers={allDrivers}
            accentColor={rankColor}
            isSprint={isSprint}
            isWet={isWet}
          />
        </div>
      </div>
    </Panel>
  );
}

// ─── P2/P3 podium card (v3 — passes isSprint/isWet to charts) ────────────────

function PodiumCard({
  driver,
  rank,
  allDrivers,
  isSprint,
  isWet,
}: {
  driver: DriverPrediction;
  rank: number;
  allDrivers: DriverPrediction[];
  isSprint: boolean;
  isWet: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";
  const rankColor = RANK_COLORS[rank - 1];

  return (
    <Panel
      style={{
        borderTop: `3px solid ${rankColor}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-2%",
          bottom: "-8%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(5rem, 10vw, 7rem)",
          color: "transparent",
          WebkitTextStroke: `1px rgba(255,255,255,0.03)`,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {rank}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "1.8rem",
              color: rankColor,
              lineHeight: 1,
            }}
          >
            P{rank}
          </span>
          <div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
                textTransform: "uppercase",
                color: "white",
                letterSpacing: "-0.01em",
                lineHeight: 1.05,
              }}
            >
              {driver.givenName}{" "}
              <span style={{ color: rankColor }}>{driver.familyName}</span>
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: teamColor,
                marginTop: "2px",
              }}
            >
              {driver.constructorName}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "1.4rem",
              color: rankColor,
              lineHeight: 1,
            }}
          >
            {driver.podiumProbability}%
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.48rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
              marginTop: "2px",
            }}
          >
            Probability
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem", position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.48rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            Model Score
          </span>
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.48rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {driver.score.toFixed(1)} / 100
          </span>
        </div>
        <div
          style={{
            height: "2px",
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${driver.score}%`,
              background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}88 100%)`,
              transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.25)",
          margin: "0 0 0.75rem",
          lineHeight: 1.55,
          fontStyle: "italic",
          position: "relative",
        }}
      >
        {driver.insight}
      </p>

      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.3)",
          padding: "0.3rem 0.75rem",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: "0.55rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
          width: "100%",
          textAlign: "center",
          transition: "all 0.15s ease",
          position: "relative",
        }}
      >
        {expanded ? "▲ Hide charts" : "▼ Show factor charts"}
      </button>

      <div
        style={{
          maxHeight: expanded ? "560px" : "0",
          overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: "0.75rem",
            paddingTop: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
                marginBottom: "0.5rem",
              }}
            >
              Factor Profile
            </span>
            <ScoreRadarChart
              driver={driver}
              accentColor={rankColor}
              isSprint={isSprint}
              isWet={isWet}
            />
          </div>
          <div>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              vs Field Average
            </span>
            <DriverVsFieldChart
              driver={driver}
              allDrivers={allDrivers}
              isSprint={isSprint}
              isWet={isWet}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ─── Finisher row (unchanged from v2) ─────────────────────────────────────────

function FinisherRow({
  driver,
  index,
}: {
  driver: DriverPrediction;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";
  const hasPenalty = driver.factors.gridPenalty < 50;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "2rem 1fr 80px auto auto",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.85rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        borderLeft: hovered
          ? "2px solid rgba(225,6,0,0.5)"
          : "2px solid transparent",
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.6rem",
          color: "rgba(255,255,255,0.15)",
          textAlign: "center",
        }}
      >
        P{index + 4}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: teamColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {driver.givenName} {driver.familyName}
          </span>
          {hasPenalty && (
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.44rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,160,0,0.7)",
                border: "1px solid rgba(255,160,0,0.2)",
                padding: "1px 3px",
                flexShrink: 0,
              }}
            >
              ⚠ PEN
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.55rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: teamColor,
            opacity: 0.75,
            marginTop: "1px",
            paddingLeft: "13px",
          }}
        >
          {driver.constructorName}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {[driver.factors.currentForm, driver.factors.qualifyingStrength].map(
          (val, i) => (
            <div
              key={i}
              style={{
                height: "2px",
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${val}%`,
                  background: i === 0 ? "#E10600" : "rgba(255,255,255,0.25)",
                }}
              />
            </div>
          ),
        )}
      </div>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.68rem",
          color: "rgba(255,255,255,0.3)",
          textAlign: "right",
        }}
      >
        {driver.score.toFixed(1)}
      </div>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.68rem",
          color: "rgba(255,255,255,0.18)",
          textAlign: "right",
        }}
      >
        {driver.podiumProbability}%
      </div>
    </div>
  );
}

// ─── Methodology section (v3 — 8 factors) ────────────────────────────────────

function MethodologySection() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        marginTop: "4rem",
        background: "rgba(255,255,255,0.01)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "4rem clamp(1.25rem, 4vw, 1.5rem)",
        }}
      >
        <SectionHeader
          overline="How It Works"
          title="Model Methodology"
          subtitle="8 factor weights and data sources behind every prediction"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "3rem",
            alignItems: "start",
          }}
          className="methodology-grid"
        >
          <div>
            {/* Segmented weight bar */}
            <div
              style={{
                display: "flex",
                gap: "1px",
                height: "6px",
                marginBottom: "2rem",
                overflow: "hidden",
              }}
            >
              {METHODOLOGY_FACTORS.map((f) => (
                <div
                  key={f.label}
                  style={{
                    height: "100%",
                    width: `${f.weight}%`,
                    background: f.color,
                    transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              ))}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              {METHODOLOGY_FACTORS.map((f, i) => (
                <div
                  key={f.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr",
                    alignItems: "start",
                    gap: "1rem 1.25rem",
                    padding: "1rem 1.25rem",
                    borderBottom:
                      i < METHODOLOGY_FACTORS.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.4rem",
                      color: f.color,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    {f.weight}%
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.35rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "white",
                        }}
                      >
                        {f.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          minWidth: "40px",
                          height: "2px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${f.weight * 2.86}%`,
                            background: f.color,
                            maxWidth: "100%",
                          }}
                        />
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "0.73rem",
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.3)",
                        margin: 0,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donut */}
          <div style={{ paddingTop: "3.5rem" }}>
            <FactorWeightDonut />
          </div>
        </div>

        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.68rem",
            color: "rgba(255,255,255,0.13)",
            marginTop: "1.5rem",
            lineHeight: 1.7,
            maxWidth: "680px",
          }}
        >
          Predictions are generated from Jolpica F1 API data, OpenMeteo weather
          forecasts, and OpenF1 race control messages. All scores are min-max
          normalised per factor then combined with the weights above. Win
          probabilities are derived from softmax (τ=8) over the top-10 model
          scores. Weather and sprint factors are neutral (score 50) when not
          applicable — they add signal only when active.
        </p>
      </div>

      <style>{`@media (max-width: 560px) { .methodology-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PredictionClient({
  initialPrediction,
  initialError,
}: PredictionClientProps) {
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const {
    prediction: livePrediction,
    isLoading,
    error: liveError,
    refetch,
  } = usePrediction({ enabled: refreshEnabled });

  const prediction = livePrediction ?? initialPrediction;
  const error = liveError ?? initialError;

  const handleRefresh = () => {
    if (!refreshEnabled) {
      setRefreshEnabled(true);
      setTimeout(() => refetch(), 0);
    } else {
      refetch();
    }
  };

  if (error && !prediction) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
        }}
      >
        <div style={{ width: "32px", height: "2px", background: "#E10600" }} />
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            maxWidth: "360px",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </p>
        <button
          onClick={handleRefresh}
          style={{
            background: "#E10600",
            border: "none",
            color: "white",
            padding: "0.65rem 1.75rem",
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !prediction) {
    return (
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem clamp(1.25rem, 4vw, 1.5rem)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <SkeletonBlock height={360} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
          }}
        >
          <SkeletonBlock height={280} />
          <SkeletonBlock height={280} />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} height={56} />
        ))}
      </div>
    );
  }

  if (!prediction) return null;

  const [p1, p2, p3] = prediction.predictions;
  const likelyFinishers = prediction.likelyFinishers;
  const allDrivers = [...prediction.predictions, ...likelyFinishers];
  const sortedFinishers = [...likelyFinishers].sort(
    (a, b) => b.score - a.score,
  );

  // v3 context flags — passed down to all child components
  const isSprint = prediction.isSprint ?? false;
  const isWet = prediction.weather?.isWetExpected ?? false;

  const RefreshButton = (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.1)",
        color: isLoading ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
        padding: "0.45rem 1rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 600,
        fontSize: "0.65rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: isLoading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          animation: isLoading ? "clientSpin 1s linear infinite" : "none",
        }}
      >
        <path
          d="M14 8A6 6 0 1 1 8 2M14 2v4h-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isLoading ? "Updating…" : "Refresh"}
    </button>
  );

  return (
    <>
      <PredictionHero prediction={prediction} />

      <div
        style={{
          position: "relative",
          background: PAGE_BG,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "400px",
            background:
              "radial-gradient(ellipse at top, rgba(225,6,0,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Podium section */}
        <section
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            position: "relative",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "3rem clamp(1rem, 4vw, 1.5rem)",
            }}
          >
            <SectionHeader
              overline="Podium Prediction"
              title="Race Contenders"
              subtitle="8-factor model · weather, sprint, and tyre compound awareness"
              action={RefreshButton}
            />

            {/* v3: Weekend context banner */}
            <WeekendContextBanner prediction={prediction} />

            {p1 && (
              <div
                style={{
                  marginBottom: "2px",
                  animation:
                    "clientSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                <P1FeatureCard
                  driver={p1}
                  allDrivers={allDrivers}
                  isSprint={isSprint}
                  isWet={isWet}
                />
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "2px",
                marginTop: "2px",
              }}
            >
              {p2 && (
                <div
                  style={{
                    animation:
                      "clientSlideUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both",
                  }}
                >
                  <PodiumCard
                    driver={p2}
                    rank={2}
                    allDrivers={allDrivers}
                    isSprint={isSprint}
                    isWet={isWet}
                  />
                </div>
              )}
              {p3 && (
                <div
                  style={{
                    animation:
                      "clientSlideUp 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) both",
                  }}
                >
                  <PodiumCard
                    driver={p3}
                    rank={3}
                    allDrivers={allDrivers}
                    isSprint={isSprint}
                    isWet={isWet}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Probability landscape (unchanged) */}
        <section style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "3rem clamp(1rem, 4vw, 1.5rem)",
            }}
          >
            <SectionHeader
              overline="Statistical Overview"
              title="Probability Landscape"
              subtitle="Win probability distribution — softmax τ=8 over top-10 model scores"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "2.5rem",
                alignItems: "start",
              }}
              className="landscape-grid"
            >
              <Panel>
                <ProbabilityDistributionChart
                  podium={prediction.predictions}
                  finishers={sortedFinishers}
                />
              </Panel>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  minWidth: "160px",
                }}
              >
                <Panel>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.52rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Favourite
                  </div>
                  {p1 && (
                    <>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "1rem",
                          textTransform: "uppercase",
                          color: RANK_COLORS[0],
                          letterSpacing: "-0.01em",
                          lineHeight: 1.1,
                        }}
                      >
                        {p1.familyName}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "1.8rem",
                          color: RANK_COLORS[0],
                          lineHeight: 1,
                          marginTop: "2px",
                        }}
                      >
                        {p1.podiumProbability}%
                      </div>
                      <div
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.5rem",
                          color: "rgba(255,255,255,0.15)",
                          letterSpacing: "0.06em",
                          marginTop: "2px",
                        }}
                      >
                        win probability
                      </div>
                    </>
                  )}
                </Panel>
                <Panel>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.52rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Model τ
                  </div>
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.8rem",
                      color: "#27F4D2",
                      lineHeight: 1,
                    }}
                  >
                    8
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.5rem",
                      color: "rgba(255,255,255,0.15)",
                      letterSpacing: "0.06em",
                      marginTop: "2px",
                      lineHeight: 1.5,
                    }}
                  >
                    softmax temperature
                  </div>
                </Panel>
                <Panel>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.52rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Top-10 Coverage
                  </div>
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.8rem",
                      color: "#FF8000",
                      lineHeight: 1,
                    }}
                  >
                    {[...prediction.predictions, ...sortedFinishers].reduce(
                      (s, d) => s + d.podiumProbability,
                      0,
                    )}
                    %
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.5rem",
                      color: "rgba(255,255,255,0.15)",
                      letterSpacing: "0.06em",
                      marginTop: "2px",
                      lineHeight: 1.5,
                    }}
                  >
                    of total probability mass
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </section>

        {/* Likely finishers */}
        {sortedFinishers.length > 0 && (
          <section style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "3rem clamp(1rem, 4vw, 1.5rem)",
              }}
            >
              <SectionHeader
                overline="Points Finishers"
                title="Likely Top 10"
                subtitle="Red bar = form · grey bar = qualifying pace · ⚠ = grid penalty"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2rem 1fr 80px auto auto",
                  gap: "0.75rem",
                  padding: "0.35rem 1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {["Pos", "Driver", "Form/Quali", "Score", "Prob"].map((h) => (
                  <div
                    key={h}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.48rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.16)",
                      textAlign: h === "Driver" ? "left" : "right",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              <Panel
                style={{
                  padding: 0,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {sortedFinishers.map((driver, i) => (
                  <FinisherRow
                    key={driver.driverId}
                    driver={driver}
                    index={i}
                  />
                ))}
              </Panel>
            </div>
          </section>
        )}

        <MethodologySection />
      </div>

      <style>{`
        @keyframes clientSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes clientPulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes clientSpin    { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .landscape-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
