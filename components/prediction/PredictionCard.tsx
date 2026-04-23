/**
 * components/prediction/PredictionCard.tsx
 *
 * Displays a single driver's prediction data as a card, showing:
 *   - Rank badge (P1/P2/P3 are highlighted with gold/silver/bronze)
 *   - Driver name + team
 *   - Podium probability bar
 *   - Factor breakdown (4 sub-score bars)
 *   - Insight sentence
 *
 * Hover state lifts the card and adds a red left-border accent —
 * consistent with other interactive cards in the app.
 */
"use client";

import { useState } from "react";
import { DriverPrediction } from "@/lib/types/prediction";

// Team brand colours — used for the constructor name label.
// Fallback is F1 red for unrecognised teams.
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

/** Gold / silver / bronze for top 3, white thereafter */
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

interface PredictionCardProps {
  prediction: DriverPrediction;
  rank?: number; // 1-based — optional for unranked "likely finishers" group
}

/** A labelled horizontal bar — used for factor breakdown */
function FactorBar({
  label,
  value,
  color = "#E10600",
}: {
  label: string;
  value: number; // 0–100
  color?: string;
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
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {label}
        </span>
        <span
          className="data-readout"
          style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)" }}
        >
          {value}
        </span>
      </div>
      {/* Track */}
      <div
        style={{
          height: "3px",
          background: "rgba(255,255,255,0.07)",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Fill — width driven by the normalised 0–100 score */}
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
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
}: PredictionCardProps) {
  const [hovered, setHovered] = useState(false);

  const rankColor = rank ? (RANK_COLORS[rank - 1] ?? "white") : "white";
  const teamColor = TEAM_COLORS[prediction.constructorId] ?? "#E10600";
  const isPodium = rank !== undefined && rank <= 3;

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
      {/* Top glow on podium positions */}
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

      {/* ── Header row: rank + name + probability ─────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        {/* Left: rank badge + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Rank badge */}
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

          {/* Name + constructor */}
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
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: teamColor,
                marginTop: "2px",
                opacity: 0.85,
              }}
            >
              {prediction.constructorName}
            </div>
          </div>
        </div>

        {/* Right: probability circle */}
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
            className="data-readout"
            style={{
              fontSize: "0.52rem",
              color: "rgba(255,255,255,0.3)",
              marginTop: "2px",
            }}
          >
            probability
          </div>
        </div>
      </div>

      {/* ── Overall score bar ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span
            className="data-readout"
            style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.25)" }}
          >
            Overall Score
          </span>
          <span
            className="data-readout"
            style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}
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

      {/* ── Factor breakdown — only shown on hover or for top 3 ────────── */}
      <div
        style={{
          maxHeight: hovered || isPodium ? "200px" : "0",
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
          <FactorBar
            label="Recent Form"
            value={prediction.factors.currentForm}
            color={teamColor}
          />
          <FactorBar
            label="Championship"
            value={prediction.factors.championshipPosition}
            color={teamColor}
          />
          <FactorBar
            label="Circuit History"
            value={prediction.factors.circuitHistory}
            color={teamColor}
          />
          <FactorBar
            label="Qualifying Pace"
            value={prediction.factors.qualifyingStrength}
            color={teamColor}
          />
        </div>
      </div>

      {/* ── Insight sentence ─────────────────────────────────────────── */}
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
