/**
 * components/prediction/PredictionClient.tsx
 *
 * F1 prediction page — nerd edition.
 *
 * Sections:
 *   PredictionHero       ← unchanged
 *   Podium Analysis      ← P1 feature card + radar chart + vs-field chart
 *   P2/P3 cards          ← with their own radars
 *   Probability Landscape ← full distribution chart + donut
 *   Likely Finishers     ← dense table (unchanged)
 *   Methodology          ← factor breakdown with donut
 *
 * New components consumed:
 *   ScoreRadarChart
 *   ProbabilityDistributionChart
 *   FactorWeightDonut
 *   DriverVsFieldChart
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

// ─── Constants ─────────────────────────────────────────────────────────────────

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

// ─── Page background ───────────────────────────────────────────────────────────
// Carbon-texture dark bg with a very faint grid, so content pops.

const PAGE_BG = "#080808";

// ─── Reusable primitives ───────────────────────────────────────────────────────

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

// ─── Panel wrapper — shared backdrop card ─────────────────────────────────────

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

// ─── Stat tile ────────────────────────────────────────────────────────────────

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

// ─── P1 feature ───────────────────────────────────────────────────────────────

function P1FeatureCard({
  driver,
  allDrivers,
}: {
  driver: DriverPrediction;
  allDrivers: DriverPrediction[];
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

      {/* Top: rank badge + name + probability */}
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

        {/* Probability */}
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

      {/* Insight */}
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

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
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
          sub="0–100 normalised"
        />
        <StatTile
          label="Qualifying"
          value={driver.factors.qualifyingStrength}
          color={teamColor}
          sub="0–100 normalised"
        />
        <StatTile
          label="Circuit Hist."
          value={driver.factors.circuitHistory}
          color={teamColor}
          sub="last 10 seasons"
        />
      </div>

      {/* Charts row — radar + vs field */}
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
        {/* Radar */}
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
            <ScoreRadarChart driver={driver} accentColor={rankColor} />
          </div>
        </div>

        {/* Vs field */}
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
            Performance vs Field
          </div>
          <DriverVsFieldChart
            driver={driver}
            allDrivers={allDrivers}
            accentColor={rankColor}
          />
        </div>
      </div>
    </Panel>
  );
}

// ─── P2/P3 compact card ───────────────────────────────────────────────────────

function PodiumCard({
  driver,
  rank,
  allDrivers,
}: {
  driver: DriverPrediction;
  rank: number;
  allDrivers: DriverPrediction[];
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
      {/* Ghost rank */}
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

      {/* Top row */}
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

      {/* Score bar */}
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

      {/* Insight */}
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

      {/* Expand toggle */}
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

      {/* Expanded charts */}
      <div
        style={{
          maxHeight: expanded ? "500px" : "0",
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
            <ScoreRadarChart driver={driver} accentColor={rankColor} />
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
            <DriverVsFieldChart driver={driver} allDrivers={allDrivers} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ─── Finisher row ─────────────────────────────────────────────────────────────

function FinisherRow({
  driver,
  index,
}: {
  driver: DriverPrediction;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";

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

      {/* Mini dual bars (form + quali) */}
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

// ─── Methodology section ──────────────────────────────────────────────────────

function MethodologySection({
  allDrivers,
}: {
  allDrivers: DriverPrediction[];
}) {
  const factors = [
    {
      weight: 45,
      label: "Recent Form",
      desc: "Recency-weighted race finishing positions across the last 5 races. Most recent counts 3× the oldest. Mechanical DNFs carry a -2 penalty; collision DNFs score 0.",
      color: "#E10600",
    },
    {
      weight: 20,
      label: "Qualifying Pace",
      desc: "Recency-weighted qualifying positions, same 5-race window. Pole position converts to a win ~40% of the time in modern F1 — doubled in weight vs v1.",
      color: "#FF8000",
    },
    {
      weight: 20,
      label: "Championship Standing",
      desc: "Position + wins bonus (wins×0.5) after the last completed round. Two drivers tied on position are separated by win count.",
      color: "#27F4D2",
    },
    {
      weight: 15,
      label: "Circuit History",
      desc: "Podium finishes at this specific circuit in the last 10 seasons only. All-time data is excluded to prevent retired-era drivers from skewing scores.",
      color: "#FFD700",
    },
  ];

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
          subtitle="Factor weights and data sources behind every prediction"
        />

        {/* Two-column layout: factor rows + donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "3rem",
            alignItems: "start",
          }}
          className="methodology-grid"
        >
          {/* Factor rows */}
          <div>
            {/* Segmented weight bar */}
            <div
              style={{
                display: "flex",
                gap: "2px",
                height: "6px",
                marginBottom: "2rem",
                overflow: "hidden",
              }}
            >
              {factors.map((f) => (
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
              {factors.map((f, i) => (
                <div
                  key={f.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr",
                    alignItems: "start",
                    gap: "1rem 1.25rem",
                    padding: "1.1rem 1.25rem",
                    borderBottom:
                      i < factors.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.6rem",
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
                        marginBottom: "0.4rem",
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
                            width: `${f.weight * 2}%`,
                            background: f.color,
                            maxWidth: "100%",
                          }}
                        />
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "0.75rem",
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

          {/* Donut chart */}
          <div style={{ paddingTop: "3.5rem" }}>
            <FactorWeightDonut />
          </div>
        </div>

        {/* Disclaimer */}
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
          Predictions are generated from historical and current-season data via
          the Jolpica F1 API. All scores are min-max normalised per factor and
          weighted. Win probabilities are derived from softmax (τ=8) over the
          top-10 scores. This is a statistical model — actual race outcomes
          depend on many unpredictable factors.
        </p>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .methodology-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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

  // ── Error ──────────────────────────────────────────────────────────────────
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

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // Refresh button
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
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <PredictionHero prediction={prediction} />

      {/* ── Page content backdrop ────────────────────────────────────────────
          Subtle radial glow + dot grid to give the dark page some depth     */}
      <div
        style={{
          position: "relative",
          background: PAGE_BG,
          // Dot grid texture
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Ambient glow behind the top of the content */}
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

        {/* ── Podium ──────────────────────────────────────────────────────── */}
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
              subtitle="AI-powered finishing order — factor radar, probability, and vs-field analysis"
              action={RefreshButton}
            />

            {/* P1 — full width feature */}
            {p1 && (
              <div
                style={{
                  marginBottom: "2px",
                  animation:
                    "clientSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                <P1FeatureCard driver={p1} allDrivers={allDrivers} />
              </div>
            )}

            {/* P2 / P3 — side by side */}
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
                  <PodiumCard driver={p2} rank={2} allDrivers={allDrivers} />
                </div>
              )}
              {p3 && (
                <div
                  style={{
                    animation:
                      "clientSlideUp 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) both",
                  }}
                >
                  <PodiumCard driver={p3} rank={3} allDrivers={allDrivers} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Probability Landscape ─────────────────────────────────────────── */}
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
              subtitle="Win probability distribution across all scored drivers — softmax τ=8 over top-10 model scores"
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

              {/* Key stats */}
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

        {/* ── Likely Finishers ──────────────────────────────────────────────── */}
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
                subtitle="Drivers predicted to score points — red bar = form, grey bar = qualifying pace"
              />

              {/* Column headers */}
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

        {/* ── Methodology ───────────────────────────────────────────────────── */}
        <MethodologySection allDrivers={allDrivers} />
      </div>

      {/* ── Keyframes ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes clientSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes clientPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes clientSpin {
          to { transform: rotate(360deg); }
        }

        /* Mobile: stack probability landscape */
        @media (max-width: 640px) {
          .landscape-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
