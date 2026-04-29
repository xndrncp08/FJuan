/**
 * components/prediction/PredictionCard.tsx
 *
 * v3 — 8 factor bars grouped into Performance + Race Context sections.
 * Context section bars are visually dimmed when the factor is irrelevant
 * (e.g. Sprint Form dims on non-sprint weekends, Weather dims on dry days).
 */
"use client";

import { useState } from "react";
import { DriverPrediction } from "@/lib/types/prediction";

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

interface PredictionCardProps {
  prediction: DriverPrediction;
  rank?: number;
  isSprint?: boolean;
  isWet?: boolean;
}

function FactorBar({
  label,
  value,
  color = "#E10600",
  dimmed = false,
}: {
  label: string;
  value: number;
  color?: string;
  dimmed?: boolean;
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "3px",
        }}
      >
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.63rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: dimmed ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.58rem",
            fontWeight: 700,
            color: dimmed ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)",
          }}
        >
          {value}
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
            width: `${value}%`,
            background: dimmed ? "rgba(255,255,255,0.1)" : color,
            transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

export default function PredictionCard({
  prediction,
  rank,
  isSprint = false,
  isWet = false,
}: PredictionCardProps) {
  const [hovered, setHovered] = useState(false);

  const rankColor = rank ? (RANK_COLORS[rank - 1] ?? "white") : "white";
  const teamColor = TEAM_COLORS[prediction.constructorId] ?? "#E10600";
  const isPodium = rank !== undefined && rank <= 3;
  const hasPenalty = prediction.factors.gridPenalty < 50;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "1.5rem",
        background: hovered
          ? "rgba(255,255,255,0.025)"
          : isPodium
            ? "rgba(255,255,255,0.01)"
            : "transparent",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: isPodium
          ? `3px solid ${rankColor}`
          : hovered
            ? "3px solid rgba(225,6,0,0.4)"
            : "3px solid transparent",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      {/* Podium top glow */}
      {isPodium && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: `linear-gradient(90deg, ${rankColor}55 0%, transparent 80%)`,
          }}
        />
      )}

      {/* Grid penalty badge */}
      {hasPenalty && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "0.2rem 0.5rem",
            background: "rgba(255,160,0,0.1)",
            border: "1px solid rgba(255,160,0,0.22)",
            borderTop: "none",
            borderRight: "none",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.46rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,160,0,0.8)",
          }}
        >
          ⚠ Grid Penalty
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Rank */}
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: isPodium ? "1.5rem" : "1.1rem",
              color: rankColor,
              lineHeight: 1,
              minWidth: "2rem",
              textAlign: "center",
              opacity: isPodium ? 1 : 0.5,
            }}
          >
            {rank !== undefined ? `P${rank}` : "—"}
          </div>

          {/* Name + team + context badges */}
          <div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "1rem",
                textTransform: "uppercase",
                color: "white",
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              {prediction.givenName}{" "}
              <span style={{ color: rankColor }}>{prediction.familyName}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "3px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: teamColor,
                  opacity: 0.85,
                }}
              >
                {prediction.constructorName}
              </span>
              {isSprint && (
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.44rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#FF8000",
                    border: "1px solid rgba(255,128,0,0.3)",
                    padding: "1px 4px",
                  }}
                >
                  Sprint
                </span>
              )}
              {isWet && (
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.44rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#64C4FF",
                    border: "1px solid rgba(100,196,255,0.3)",
                    padding: "1px 4px",
                  }}
                >
                  Wet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Probability */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "1.5rem",
              color: rankColor,
              lineHeight: 1,
            }}
          >
            {prediction.podiumProbability}%
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.52rem",
              color: "rgba(255,255,255,0.3)",
              marginTop: "2px",
              letterSpacing: "0.06em",
            }}
          >
            probability
          </div>
        </div>
      </div>

      {/* ── Overall score bar ── */}
      <div style={{ marginBottom: "1.25rem" }}>
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
              fontSize: "0.55rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Overall Score
          </span>
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {prediction.score.toFixed(1)} / 100
          </span>
        </div>
        <div
          style={{
            height: "4px",
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${prediction.score}%`,
              background: isPodium
                ? `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}99 100%)`
                : "rgba(225,6,0,0.7)",
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      {/* ── Factor breakdown — hover or podium only ── */}
      <div
        style={{
          maxHeight: hovered || isPodium ? "480px" : "0",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "1rem",
            marginTop: "0.25rem",
          }}
        >
          {/* Performance factors */}
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.46rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.14)",
              marginBottom: "0.6rem",
            }}
          >
            Performance
          </div>
          <FactorBar
            label="Recent Form"
            value={prediction.factors.currentForm}
            color={teamColor}
          />
          <FactorBar
            label="Qualifying"
            value={prediction.factors.qualifyingStrength}
            color={teamColor}
          />
          <FactorBar
            label="Championship"
            value={prediction.factors.championshipPosition}
            color={teamColor}
          />
          <FactorBar
            label="Circuit Hist."
            value={prediction.factors.circuitHistory}
            color={teamColor}
          />

          {/* Race context factors */}
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.46rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.14)",
              margin: "0.9rem 0 0.6rem",
            }}
          >
            Race Context
          </div>
          <FactorBar
            label="Weather"
            value={prediction.factors.weatherAdaptability}
            color="#64C4FF"
            dimmed={!isWet}
          />
          <FactorBar
            label="Sprint Form"
            value={prediction.factors.sprintForm}
            color="#FF8000"
            dimmed={!isSprint}
          />
          <FactorBar
            label="Tyre Fit"
            value={prediction.factors.tyreFit}
            color={teamColor}
          />
          <FactorBar
            label="Grid Status"
            value={prediction.factors.gridPenalty}
            color={
              hasPenalty ? "rgba(255,160,0,0.85)" : "rgba(255,255,255,0.2)"
            }
            dimmed={!hasPenalty}
          />
        </div>
      </div>

      {/* ── Insight ── */}
      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.28)",
          margin: "0.75rem 0 0",
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        {prediction.insight}
      </p>
    </div>
  );
}
