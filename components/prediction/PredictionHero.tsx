/**
 * components/prediction/PredictionHero.tsx
 *
 * Hero banner for the /predict page — shows the race name, circuit, date,
 * and a brief description of the model.
 *
 * Matches the visual language of other hero sections in the app:
 * red overline label · Russo One title · data-readout metadata row.
 */
"use client";

import { RacePrediction } from "@/lib/types/prediction";
import { format } from "date-fns";

interface PredictionHeroProps {
  prediction: RacePrediction;
}

export default function PredictionHero({ prediction }: PredictionHeroProps) {
  // Parse the date — it arrives as "YYYY-MM-DD"
  const raceDate = new Date(`${prediction.raceDate}T00:00:00`);
  const formattedDate = format(raceDate, "dd MMM yyyy");

  return (
    <section
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle diagonal red glow top-right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "40%",
          height: "100%",
          background:
            "radial-gradient(ellipse at top right, rgba(225,6,0,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,1.5rem)",
        }}
      >
        {/* Overline */}
        <div style={{ marginBottom: "1rem" }}>
          <span className="label-overline">Race Prediction</span>
        </div>

        {/* Main title */}
        <h1
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            lineHeight: 0.95,
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.02em",
            margin: "0 0 0.75rem",
          }}
        >
          {prediction.raceName}
        </h1>

        {/* Circuit + date metadata */}
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "rgba(255,255,255,0.4)",
            margin: "0 0 2rem",
            fontWeight: 500,
          }}
        >
          {prediction.circuitName} · {formattedDate}
        </p>

        {/* Model summary pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.5rem 1rem",
            background: "rgba(225,6,0,0.07)",
            border: "1px solid rgba(225,6,0,0.2)",
          }}
        >
          {/* Small waveform icon to hint at "model/AI" */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            style={{ color: "#E10600", flexShrink: 0 }}
          >
            <path
              d="M1 8h2l2-5 2 10 2-8 2 6 2-3h2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="data-readout"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}
          >
            {prediction.modelSummary}
          </span>
        </div>
      </div>
    </section>
  );
}