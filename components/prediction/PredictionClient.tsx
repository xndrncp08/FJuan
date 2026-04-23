/**
 * components/prediction/PredictionClient.tsx
 *
 * The full client-side prediction page layout.
 * Receives server-pre-fetched data as props but also supports
 * live refresh via the usePrediction hook (Refresh button).
 *
 * Layout:
 *   PredictionHero            ← race name, circuit, date, model summary
 *   PodiumHighlight           ← P2 / P1 / P3 trophy-style on desktop, stacked on mobile
 *   Likely Finishers          ← P4–P10 as a compact ordered list (no grid gaps)
 *   Methodology footer        ← explains the model weights
 */
"use client";

import { useState } from "react";
import { RacePrediction, DriverPrediction } from "@/lib/types/prediction";
import { usePrediction } from "@/lib/hooks/usePrediction";
import PredictionHero from "./PredictionHero";
import PredictionCard from "@/components/prediction/PredictionCard";
import PredictionChat from "./PredictionChat";

interface PredictionClientProps {
  /** Pre-fetched on the server for instant paint */
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// ─── Podium step card ─────────────────────────────────────────────────────────
// A specialised card for the P1/P2/P3 podium display.
// Larger and more prominent than the compact list rows below.

function PodiumStepCard({
  driver,
  rank,
  isWinner,
}: {
  driver: DriverPrediction;
  rank: number;
  isWinner: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const rankColor = RANK_COLORS[rank - 1];
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: isWinner ? "2rem 1.5rem" : "1.5rem",
        background: hovered
          ? "rgba(255,255,255,0.03)"
          : isWinner
            ? "rgba(255,215,0,0.03)"
            : "rgba(255,255,255,0.01)",
        borderTop: `3px solid ${rankColor}`,
        border: `1px solid rgba(255,255,255,0.07)`,
        borderTopColor: rankColor,
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        // Winner card is taller to visually elevate it
        marginTop: isWinner ? "0" : "2rem",
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
          background: `linear-gradient(180deg, ${rankColor}12 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Rank + probability row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "3rem" : "2rem",
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
              fontSize: isWinner ? "1.6rem" : "1.2rem",
              color: rankColor,
              lineHeight: 1,
            }}
          >
            {driver.podiumProbability}%
          </div>
          <div
            className="data-readout"
            style={{
              fontSize: "0.5rem",
              color: "rgba(255,255,255,0.25)",
              marginTop: "2px",
            }}
          >
            probability
          </div>
        </div>
      </div>

      {/* Driver name */}
      <div>
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "1.4rem" : "1.1rem",
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {driver.givenName}{" "}
          <span style={{ color: rankColor }}>{driver.familyName}</span>
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: teamColor,
            marginTop: "3px",
            opacity: 0.85,
          }}
        >
          {driver.constructorName}
        </div>
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
            className="data-readout"
            style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.2)" }}
          >
            Score
          </span>
          <span
            className="data-readout"
            style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.35)" }}
          >
            {driver.score.toFixed(1)}
          </span>
        </div>
        <div
          style={{
            height: "3px",
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${driver.score}%`,
              background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}88 100%)`,
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      {/* Insight */}
      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.28)",
          margin: 0,
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        {driver.insight}
      </p>
    </div>
  );
}

// ─── Compact finisher row ─────────────────────────────────────────────────────
// Used for the "Likely Finishers" list — a single horizontal row per driver.
// No rank shown, no empty grid gaps.

function FinisherRow({ driver }: { driver: DriverPrediction }) {
  const [hovered, setHovered] = useState(false);
  const teamColor = TEAM_COLORS[driver.constructorId] ?? "#E10600";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.9rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        borderLeft: hovered
          ? "2px solid rgba(225,6,0,0.4)"
          : "2px solid transparent",
        transition: "all 0.15s ease",
      }}
    >
      {/* Team colour dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: teamColor,
          flexShrink: 0,
        }}
      />

      {/* Driver name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.01em",
          }}
        >
          {driver.givenName} {driver.familyName}
        </span>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: teamColor,
            marginLeft: "0.6rem",
            opacity: 0.8,
          }}
        >
          {driver.constructorName}
        </span>
      </div>

      {/* Score pill */}
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          flexShrink: 0,
        }}
      >
        {driver.score.toFixed(1)}
      </div>

      {/* Probability */}
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.25)",
          flexShrink: 0,
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
      weight: "55%",
      label: "Recent Form",
      desc: "Recency-weighted finishing positions across the last 5 races. Most recent race counts most.",
    },
    {
      weight: "20%",
      label: "Championship Standing",
      desc: "Points standing after the last completed round — reflects consistent season pace.",
    },
    {
      weight: "10%",
      label: "Circuit History",
      desc: "Podium finishes at this circuit over the last 10 seasons. Capped to avoid retired-era bias.",
    },
    {
      weight: "15%",
      label: "Qualifying Pace",
      desc: "Recency-weighted qualifying positions — pole converts to a win ~40% of the time in modern F1.",
    },
  ];

  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: "4rem",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem clamp(1.25rem,4vw,1.5rem)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <span className="label-overline">How It Works</span>
          <h2
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              textTransform: "uppercase",
              color: "white",
              margin: "0.5rem 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            Model Methodology
          </h2>
        </div>

        {/* Factor list — vertical stack, no grid gaps */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {factors.map((f, i) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.5rem",
                padding: "1.5rem 1.75rem",
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
                  fontSize: "1.6rem",
                  color: "#E10600",
                  lineHeight: 1,
                  minWidth: "3.5rem",
                  flexShrink: 0,
                }}
              >
                {f.weight}
              </div>
              {/* Label + desc */}
              <div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "white",
                    marginBottom: "0.35rem",
                  }}
                >
                  {f.label}
                </div>
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.8rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.35)",
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
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.2)",
            marginTop: "1.5rem",
            lineHeight: 1.6,
          }}
        >
          Predictions are generated from historical and current-season data via
          the Jolpica F1 API. All scores are min-max normalised per factor and
          then weighted. Podium probabilities are derived from a softmax over
          the top-10 scores. This is a statistical model — actual race outcomes
          depend on many unpredictable factors.
        </p>
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PredictionClient({
  initialPrediction,
  initialError,
}: PredictionClientProps) {
  // The hook is only used when the user clicks "Refresh" —
  // it starts disabled so we don't double-fetch on load.
  const [refreshEnabled, setRefreshEnabled] = useState(false);

  const {
    prediction: livePrediction,
    isLoading,
    error: liveError,
    refetch,
  } = usePrediction({ enabled: refreshEnabled });

  // Prefer live data if it exists (after refresh), else use server-fetched
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

  // ── Error state ───────────────────────────────────────────────────────────
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
        <span className="label-overline">Prediction Unavailable</span>
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            maxWidth: "360px",
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
            padding: "0.65rem 1.5rem",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !prediction) {
    return (
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem clamp(1.25rem,4vw,1.5rem)",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} height={i === 0 ? 260 : 180} />
        ))}
      </div>
    );
  }

  if (!prediction) return null;

  const [p1, p2, p3] = prediction.predictions; // podium — ordered P1, P2, P3
  const likelyFinishers = prediction.likelyFinishers; // unordered pool

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <PredictionHero prediction={prediction} />

      {/* ── Podium ──────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "2.5rem clamp(1.25rem,4vw,1.5rem)",
          }}
        >
          {/* Section header + refresh */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2rem",
            }}
          >
            <div>
              <span className="label-overline">Podium Prediction</span>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.25)",
                  margin: "0.25rem 0 0",
                }}
              >
                Predicted finishing order for the top 3
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: isLoading
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.45)",
                padding: "0.4rem 0.9rem",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
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
                  animation: isLoading ? "spin 1s linear infinite" : "none",
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
          </div>

          {/*
           * Podium layout:
           *   Desktop — P2 | P1 | P3  (trophy podium order, P1 elevated)
           *   Mobile  — P1, P2, P3 stacked vertically
           *
           * We use a CSS custom property trick: the order is reordered via
           * `order` so P1 always sits in the middle on desktop without JS.
           */}
          <div
            style={{
              display: "grid",
              // On mobile: single column. On desktop: 3 equal columns.
              // clamp ensures it collapses to 1 col below ~640px naturally.
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
              alignItems: "end", // step effect — P1 card starts higher
            }}
          >
            {/* P2 — left on desktop, second on mobile */}
            {p2 && (
              <div style={{ order: 1 }}>
                <PodiumStepCard driver={p2} rank={2} isWinner={false} />
              </div>
            )}
            {/* P1 — centre on desktop, first on mobile */}
            {p1 && (
              <div style={{ order: 0 }}>
                <PodiumStepCard driver={p1} rank={1} isWinner={true} />
              </div>
            )}
            {/* P3 — right on desktop, third on mobile */}
            {p3 && (
              <div style={{ order: 2 }}>
                <PodiumStepCard driver={p3} rank={3} isWinner={false} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Likely Finishers ────────────────────────────────────────────── */}
      {likelyFinishers.length > 0 && (
        <section>
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "2.5rem clamp(1.25rem,4vw,1.5rem)",
            }}
          >
            <div style={{ marginBottom: "0.35rem" }}>
              <span className="label-overline">Likely Finishers</span>
            </div>
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.25)",
                margin: "0.25rem 0 1.5rem",
              }}
            >
              Drivers likely to finish in the points — no specific order
            </p>

            {/* Column headers */}
            <div
              style={{
                display: "flex",
                padding: "0.5rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: "1rem",
              }}
            >
              <span
                className="data-readout"
                style={{
                  flex: 1,
                  fontSize: "0.5rem",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                Driver
              </span>
              <span
                className="data-readout"
                style={{
                  fontSize: "0.5rem",
                  color: "rgba(255,255,255,0.2)",
                  minWidth: "2.5rem",
                  textAlign: "right",
                }}
              >
                Score
              </span>
              <span
                className="data-readout"
                style={{
                  fontSize: "0.5rem",
                  color: "rgba(255,255,255,0.2)",
                  minWidth: "2.5rem",
                  textAlign: "right",
                }}
              >
                Prob
              </span>
            </div>

            {/* Driver rows — vertical list, zero empty space */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "none",
              }}
            >
              {likelyFinishers.map((driver) => (
                <FinisherRow key={driver.driverId} driver={driver} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Model methodology ───────────────────────────────────────────── */}
      <MethodologySection />

      {/* Keyframes — injected inline to avoid a separate CSS file */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <PredictionChat prediction={prediction} />
    </>
  );
}
