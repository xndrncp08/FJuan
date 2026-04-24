/**
 * components/prediction/PredictionClient.tsx
 *
 * Cinematic F1 broadcast redesign — full page below the hero.
 *
 * Design direction: Sky Sports F1 data overlay meets a war room tactical
 * display. Dark carbon-fibre feel, sharp red accents, angular geometry,
 * staggered entrance animations, and dense data presentation that still
 * breathes.
 *
 * Sections:
 *   PredictionHero      ← unchanged (race name, circuit, countdown)
 *   Podium              ← P1 full-width feature + P2/P3 side-by-side
 *   Likely Finishers    ← dense data table with bar visualisations
 *   Methodology         ← factor breakdown with animated weight bars
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { RacePrediction, DriverPrediction } from "@/lib/types/prediction";
import { usePrediction } from "@/lib/hooks/usePrediction";
import PredictionHero from "./PredictionHero";

interface PredictionClientProps {
  initialPrediction: RacePrediction | null;
  initialError: string | null;
}

// ─── Team colours ─────────────────────────────────────────────────────────────

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
const RANK_LABELS = ["WINNER", "2ND PLACE", "3RD PLACE"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Section header ───────────────────────────────────────────────────────────

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
      }}
    >
      <div>
        {/* Red overline with left tick */}
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
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
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

// ─── P1 Feature card ──────────────────────────────────────────────────────────
// Full-width dominant card for the race winner prediction.

function P1FeatureCard({
  driver,
  animDelay = 0,
}: {
  driver: DriverPrediction;
  animDelay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";
  const rankColor = RANK_COLORS[0];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid rgba(255,215,0,0.15)`,
        borderTop: `3px solid ${rankColor}`,
        background: hovered ? "rgba(255,215,0,0.04)" : "rgba(255,215,0,0.015)",
        transition: "background 0.25s ease",
        cursor: "default",
        animation: `clientSlideUp 0.7s ${animDelay}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      {/* Top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: `linear-gradient(180deg, ${rankColor}18 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Background rank number */}
      <div
        style={{
          position: "absolute",
          right: "-2%",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(8rem, 15vw, 14rem)",
          color: "transparent",
          WebkitTextStroke: `1px rgba(255,215,0,0.06)`,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        1
      </div>

      <div
        style={{
          position: "relative",
          padding: "2rem 2.5rem",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        {/* Left — driver info */}
        <div>
          {/* P1 badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "3rem",
                color: rankColor,
                lineHeight: 1,
              }}
            >
              P1
            </span>
            <div
              style={{
                padding: "0.2rem 0.6rem",
                border: `1px solid ${rankColor}44`,
                background: `${rankColor}0f`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.55rem",
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

          {/* Driver name */}
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              marginBottom: "0.5rem",
            }}
          >
            {driver.givenName}{" "}
            <span style={{ color: rankColor }}>{driver.familyName}</span>
          </div>

          {/* Team */}
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: teamColor,
              marginBottom: "1.25rem",
            }}
          >
            {driver.constructorName}
          </div>

          {/* Insight */}
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.35)",
              margin: "0 0 1.5rem",
              lineHeight: 1.6,
              fontStyle: "italic",
              maxWidth: "520px",
            }}
          >
            {driver.insight}
          </p>

          {/* Factor bars */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem 2rem",
              maxWidth: "480px",
            }}
          >
            {[
              { label: "Recent Form", value: driver.factors.currentForm },
              { label: "Qualifying", value: driver.factors.qualifyingStrength },
              {
                label: "Championship",
                value: driver.factors.championshipPosition,
              },
              { label: "Circuit Hist.", value: driver.factors.circuitHistory },
            ].map((f) => (
              <div key={f.label}>
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
                      fontSize: "0.58rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.58rem",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {f.value}
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${f.value}%`,
                      background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}99 100%)`,
                      transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — score + probability */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(3rem, 6vw, 5rem)",
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
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginTop: "4px",
            }}
          >
            Win Probability
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.25rem",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                marginBottom: "4px",
              }}
            >
              Model Score
            </div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "1.8rem",
                color: "white",
                lineHeight: 1,
              }}
            >
              {driver.score.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── P2/P3 compact card ───────────────────────────────────────────────────────

function PodiumCard({
  driver,
  rank,
  animDelay = 0,
}: {
  driver: DriverPrediction;
  rank: number;
  animDelay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";
  const rankColor = RANK_COLORS[rank - 1];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid rgba(255,255,255,0.07)`,
        borderTop: `3px solid ${rankColor}`,
        background: hovered
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.01)",
        transition: "background 0.2s ease",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        animation: `clientSlideUp 0.7s ${animDelay}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      {/* Top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: `linear-gradient(180deg, ${rankColor}14 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Ghost rank number */}
      <div
        style={{
          position: "absolute",
          right: "-4%",
          bottom: "-10%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(5rem, 10vw, 8rem)",
          color: "transparent",
          WebkitTextStroke: `1px rgba(255,255,255,0.04)`,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {rank}
      </div>

      <div style={{ position: "relative" }}>
        {/* Rank + prob row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.75rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "2rem",
              color: rankColor,
              lineHeight: 1,
            }}
          >
            P{rank}
          </span>
          <div style={{ textAlign: "right" }}>
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
                fontSize: "0.5rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                marginTop: "2px",
              }}
            >
              Probability
            </div>
          </div>
        </div>

        {/* Driver name */}
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          }}
        >
          {driver.givenName}{" "}
          <span style={{ color: rankColor }}>{driver.familyName}</span>
        </div>

        {/* Team */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: teamColor,
            marginTop: "4px",
            marginBottom: "1rem",
          }}
        >
          {driver.constructorName}
        </div>

        {/* Score bar */}
        <div>
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
                fontSize: "0.5rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
              }}
            >
              Model Score
            </span>
            <span
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.5rem",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {driver.score.toFixed(1)}
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
            margin: "0.75rem 0 0",
            lineHeight: 1.55,
            fontStyle: "italic",
          }}
        >
          {driver.insight}
        </p>
      </div>
    </div>
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
        gridTemplateColumns: "2rem 1fr auto auto auto",
        alignItems: "center",
        gap: "1rem",
        padding: "0.9rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
        borderLeft: hovered
          ? "2px solid rgba(225,6,0,0.5)"
          : "2px solid transparent",
        transition: "all 0.15s ease",
        animation: `clientSlideUp 0.5s ${0.05 * index}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      {/* Position indicator */}
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.15)",
          textAlign: "center",
        }}
      >
        P{index + 4}
      </div>

      {/* Driver + team */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: teamColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.82rem",
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
            fontSize: "0.6rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: teamColor,
            opacity: 0.75,
            marginTop: "2px",
            paddingLeft: "14px",
          }}
        >
          {driver.constructorName}
        </div>
      </div>

      {/* Mini factor bar */}
      <div
        style={{
          width: "80px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
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

      {/* Score */}
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.35)",
          minWidth: "2.5rem",
          textAlign: "right",
        }}
      >
        {driver.score.toFixed(1)}
      </div>

      {/* Probability */}
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.2)",
          minWidth: "2.5rem",
          textAlign: "right",
        }}
      >
        {driver.podiumProbability}%
      </div>
    </div>
  );
}

// ─── Methodology section ──────────────────────────────────────────────────────

function MethodologySection() {
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
          padding: "4rem clamp(1.25rem,4vw,1.5rem)",
        }}
      >
        <SectionHeader
          overline="How It Works"
          title="Model Methodology"
          subtitle="Factor weights and data sources behind every prediction"
        />

        {/* Segmented weight bar */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            height: "6px",
            marginBottom: "2.5rem",
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

        {/* Factor rows */}
        <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {factors.map((f, i) => (
            <div
              key={f.label}
              className="methodology-row"
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr",
                alignItems: "start",
                gap: "1.25rem 1.5rem",
                padding: "1.25rem 1.5rem",
                borderBottom:
                  i < factors.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
              }}
            >
              {/* Weight */}
              <div
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "2rem",
                  color: f.color,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {f.weight}%
              </div>

              {/* Right side: label + bar + desc */}
              <div>
                {/* Label row with inline bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "white",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.label}
                  </div>
                  {/* Bar — hidden on mobile, shown on sm+ via class */}
                  <div
                    className="methodology-bar"
                    style={{
                      flex: 1,
                      minWidth: "60px",
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

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.78rem",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.32)",
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.15)",
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
        /* On mobile: tighten padding and shrink the weight number */
        @media (max-width: 480px) {
          .methodology-row {
            grid-template-columns: 56px 1fr !important;
            padding: 1rem 1rem !important;
            gap: 0.75rem 1rem !important;
          }
          .methodology-row > div:first-child {
            font-size: 1.4rem !important;
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

  // ── Error ─────────────────────────────────────────────────────────────────
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !prediction) {
    return (
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem clamp(1.25rem,4vw,1.5rem)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <SkeletonBlock height={320} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
          }}
        >
          <SkeletonBlock height={260} />
          <SkeletonBlock height={260} />
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

  // Sort finishers by score descending for consistent ordering
  const sortedFinishers = [...likelyFinishers].sort(
    (a, b) => b.score - a.score,
  );

  // Refresh button (shared)
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
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <PredictionHero prediction={prediction} />

      {/* ── Podium ────────────────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "#060606",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "3rem clamp(1.25rem,4vw,1.5rem)",
          }}
        >
          <SectionHeader
            overline="Podium Prediction"
            title="Race Contenders"
            subtitle="AI-powered finishing order for the top 3"
            action={RefreshButton}
          />

          {/* P1 — full width feature */}
          {p1 && <P1FeatureCard driver={p1} animDelay={0} />}

          {/* P2 / P3 — side by side below */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "2px",
              marginTop: "2px",
            }}
          >
            {p2 && <PodiumCard driver={p2} rank={2} animDelay={0.1} />}
            {p3 && <PodiumCard driver={p3} rank={3} animDelay={0.2} />}
          </div>
        </div>
      </section>

      {/* ── Likely Finishers ──────────────────────────────────────────────── */}
      {sortedFinishers.length > 0 && (
        <section
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "#060606",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "3rem clamp(1.25rem,4vw,1.5rem)",
            }}
          >
            <SectionHeader
              overline="Points Finishers"
              title="Likely Top 10"
              subtitle="Drivers predicted to score points — red bar = form, grey bar = qualifying"
            />

            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2rem 1fr auto auto auto",
                gap: "1rem",
                padding: "0.4rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "0",
              }}
            >
              {["Pos", "Driver", "Form/Quali", "Score", "Prob"].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.18)",
                    textAlign: h === "Driver" ? "left" : "right",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "none",
              }}
            >
              {sortedFinishers.map((driver, i) => (
                <FinisherRow key={driver.driverId} driver={driver} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Methodology ───────────────────────────────────────────────────── */}
      <MethodologySection />

      {/* ── Global keyframes ──────────────────────────────────────────────── */}
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
      `}</style>
    </>
  );
}
