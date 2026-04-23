/**
 * components/home/PredictionPreview.tsx
 *
 * Homepage teaser for the race prediction feature.
 * Shows the predicted P1/P2/P3 for the next race with a CTA to /predict.
 * Data is pre-fetched server-side in page.tsx.
 *
 * Layout:
 *   Section header (next race name)
 *   Three compact driver rows (P1/P2/P3)
 *   CTA button → /predict
 */
"use client";

import Link from "next/link";
import { RacePrediction } from "@/lib/types/prediction";

interface PredictionPreviewProps {
  prediction: RacePrediction | null;
  nextRace: any;
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

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

export default function PredictionPreview({
  prediction,
  nextRace,
}: PredictionPreviewProps) {
  if (!prediction || !prediction.predictions.length) return null;

  return (
    <section
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        background: "#060606",
      }}
    >
      {/* Ambient glow — right side */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 40% 70% at 100% 50%, rgba(225,6,0,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}
      >
        {/* ── Header strip ─────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Waveform model icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "#E10600" }}
            >
              <path
                d="M1 8h2l2-5 2 10 2-8 2 6 2-3h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="label-overline">Prediction Model</span>
          </div>
          <span className="data-readout" style={{ fontSize: "0.55rem" }}>
            {prediction.raceName}
          </span>
        </div>

        {/* ── Body: two-column on desktop ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {/* Left: predicted podium list */}
          <div
            style={{
              padding: "2rem 1.5rem",
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h2
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                textTransform: "uppercase",
                color: "white",
                letterSpacing: "-0.01em",
                lineHeight: 0.95,
                margin: "0 0 0.5rem",
              }}
            >
              Predicted Podium
            </h2>
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.25)",
                margin: "0 0 1.75rem",
              }}
            >
              {nextRace?.Circuit?.circuitName} · Statistical model
            </p>

            {/* Podium rows */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {prediction.predictions.map((driver, i) => {
                const rankColor = RANK_COLORS[i];
                const teamColor =
                  TEAM_COLORS[driver.constructorId] ?? "#E10600";

                return (
                  <div
                    key={driver.driverId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.9rem 1rem",
                      background:
                        i === 0
                          ? "rgba(255,215,0,0.03)"
                          : "rgba(255,255,255,0.01)",
                      borderLeft: `3px solid ${rankColor}`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: i === 0 ? "1.6rem" : "1.2rem",
                        color: rankColor,
                        lineHeight: 1,
                        minWidth: "2rem",
                      }}
                    >
                      P{i + 1}
                    </span>

                    {/* Name + team */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: i === 0 ? "1rem" : "0.85rem",
                          textTransform: "uppercase",
                          color: "white",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {driver.givenName}{" "}
                        <span style={{ color: rankColor }}>
                          {driver.familyName}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: teamColor,
                          marginTop: "2px",
                          opacity: 0.8,
                        }}
                      >
                        {driver.constructorName}
                      </div>
                    </div>

                    {/* Probability */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "1.1rem",
                          color: rankColor,
                          lineHeight: 1,
                        }}
                      >
                        {driver.podiumProbability}%
                      </div>
                      <div
                        className="data-readout"
                        style={{ fontSize: "0.48rem", marginTop: "2px" }}
                      >
                        probability
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: CTA panel */}
          <div
            style={{
              padding: "2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: "1rem",
              minWidth: "100%",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              borderLeft: "none",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                lineHeight: 1.6,
                maxWidth: "180px",
              }}
            >
              Based on form, championship, circuit history & qualifying pace
            </div>

            <Link
              href="/predict"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#E10600",
                color: "white",
                padding: "0.65rem 1.25rem",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "opacity 0.15s ease",
              }}
            >
              Full Prediction
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 6h10M6 1l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
