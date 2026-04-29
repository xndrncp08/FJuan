/**
 * components/prediction/PredictionHero.tsx
 *
 * v3 — adds weather forecast badge and sprint weekend indicator
 * to the bottom row alongside the model summary pill.
 */
"use client";

import { RacePrediction } from "@/lib/types/prediction";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import { useState, useEffect } from "react";

interface PredictionHeroProps {
  prediction: RacePrediction;
}

function useCountdown(raceDateMs: number) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    past: false,
  });

  useEffect(() => {
    const raceDate = new Date(raceDateMs);
    function calculate() {
      const now = new Date();
      if (raceDate <= now) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, past: true });
        return;
      }
      setTimeLeft({
        days: differenceInDays(raceDate, now),
        hours: differenceInHours(raceDate, now) % 24,
        minutes: differenceInMinutes(raceDate, now) % 60,
        past: false,
      });
    }
    calculate();
    const id = setInterval(calculate, 60_000);
    return () => clearInterval(id);
  }, [raceDateMs]);

  return timeLeft;
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: "3.5rem" }}>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          color: "white",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.5rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginTop: "3px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function PredictionHero({ prediction }: PredictionHeroProps) {
  const raceDate = new Date(`${prediction.raceDate}T00:00:00`);
  const formattedDate = format(raceDate, "dd MMM yyyy");
  const countdown = useCountdown(raceDate.getTime());
  const circuitShort = prediction.circuitName.split(" ")[0].toUpperCase();

  // v3 context values
  const weather = prediction.weather;
  const isSprint = prediction.isSprint;

  // Weather label + colour
  const weatherLabel = weather?.isWetExpected
    ? `${weather.rainProbability}% Rain`
    : weather
      ? `${weather.rainProbability}% Rain · Dry`
      : null;
  const weatherColor = weather?.isWetExpected
    ? "#64C4FF"
    : "rgba(255,255,255,0.3)";

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#060606",
        minHeight: "clamp(340px, 45vw, 520px)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Layer 1: dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Layer 2: speed lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {[
          { top: "18%", width: "35%", delay: "0s", opacity: 0.07, left: "-5%" },
          {
            top: "32%",
            width: "55%",
            delay: "0.4s",
            opacity: 0.05,
            left: "-5%",
          },
          {
            top: "48%",
            width: "25%",
            delay: "0.8s",
            opacity: 0.09,
            left: "-5%",
          },
          {
            top: "61%",
            width: "45%",
            delay: "0.2s",
            opacity: 0.06,
            left: "-5%",
          },
          {
            top: "74%",
            width: "30%",
            delay: "1.1s",
            opacity: 0.04,
            left: "-5%",
          },
          {
            top: "85%",
            width: "60%",
            delay: "0.6s",
            opacity: 0.05,
            left: "-5%",
          },
        ].map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: line.top,
              left: line.left,
              width: line.width,
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${line.opacity * 3}) 30%, rgba(255,255,255,${line.opacity}) 70%, transparent 100%)`,
              animation: `heroSpeedLine 3s linear ${line.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Layer 3: diagonal slash */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-5%",
          width: "45%",
          height: "140%",
          background:
            "linear-gradient(105deg, transparent 45%, rgba(225,6,0,0.04) 45%, rgba(225,6,0,0.08) 55%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "8%",
          width: "45%",
          height: "140%",
          background:
            "linear-gradient(105deg, transparent 47%, rgba(225,6,0,0.03) 47%, rgba(225,6,0,0.05) 50%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Layer 4: radial glow — blue-tinted when wet */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "70%",
          height: "130%",
          background: weather?.isWetExpected
            ? "radial-gradient(ellipse at top right, rgba(100,196,255,0.08) 0%, rgba(225,6,0,0.03) 40%, transparent 70%)"
            : "radial-gradient(ellipse at top right, rgba(225,6,0,0.12) 0%, rgba(225,6,0,0.04) 40%, transparent 70%)",
          transition: "background 1s ease",
          pointerEvents: "none",
        }}
      />

      {/* Layer 5: ghost watermark */}
      <div
        style={{
          position: "absolute",
          right: "-2%",
          bottom: "-15%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(8rem, 18vw, 18rem)",
          textTransform: "uppercase",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.035)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          animation: "heroFadeIn 1.2s ease forwards",
        }}
      >
        {circuitShort}
      </div>

      {/* Layer 6: scan-lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          padding: "clamp(2.5rem,5vw,4.5rem) clamp(1.25rem,4vw,1.5rem)",
        }}
      >
        {/* Top metadata row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem",
            animation: "heroSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ position: "relative", width: "6px", height: "6px" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#E10600",
                  animation: "heroPulse 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background: "rgba(225,6,0,0.3)",
                  animation: "heroPulseRing 2s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              Race Prediction
            </span>
          </div>
          <div
            style={{
              width: "1px",
              height: "12px",
              background: "rgba(255,255,255,0.1)",
            }}
          />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {formattedDate}
          </span>
          {/* Sprint badge */}
          {isSprint && (
            <>
              <div
                style={{
                  width: "1px",
                  height: "12px",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#FF8000",
                  border: "1px solid rgba(255,128,0,0.3)",
                  padding: "1px 6px",
                }}
              >
                Sprint Weekend
              </span>
            </>
          )}
        </div>

        {/* Race name */}
        <h1
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            lineHeight: 0.92,
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.025em",
            margin: "0 0 0.5rem",
            animation: "heroSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both",
            maxWidth: "70%",
          }}
        >
          {(() => {
            const words = prediction.raceName.split(" ");
            const last = words.pop();
            return (
              <>
                {words.join(" ")}{" "}
                <span style={{ color: "#E10600" }}>{last}</span>
              </>
            );
          })()}
        </h1>

        {/* Circuit name */}
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(0.9rem, 1.8vw, 1.1rem)",
            color: "rgba(255,255,255,0.35)",
            margin: "0 0 2.5rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            animation: "heroSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {prediction.circuitName}
        </p>

        {/* Bottom row: model pill + weather badge + countdown */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            animation: "heroSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Left: model pill + weather badge */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {/* Model summary */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.55rem 1rem",
                background: "rgba(225,6,0,0.06)",
                border: "1px solid rgba(225,6,0,0.18)",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg
                width="10"
                height="10"
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
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {prediction.modelSummary}
              </span>
            </div>

            {/* Weather badge */}
            {weather && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.4rem 0.8rem",
                  background: weather.isWetExpected
                    ? "rgba(100,196,255,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${weather.isWetExpected ? "rgba(100,196,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                  transition: "all 0.3s ease",
                }}
              >
                {/* Weather icon */}
                {weather.isWetExpected ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ color: "#64C4FF", flexShrink: 0 }}
                  >
                    <path
                      d="M4 12a4 4 0 1 1 3.5-6A3 3 0 1 1 13 9H4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 14l-1 2M9 14l-1 2M12 14l-1 2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: weatherColor,
                  }}
                >
                  {weatherLabel}
                  {weather.temperatureC &&
                    ` · ${Math.round(weather.temperatureC)}°C`}
                  {weather.windSpeedKph &&
                    ` · ${Math.round(weather.windSpeedKph)} km/h wind`}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {!countdown.past && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginRight: "0.75rem",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                Race in
              </div>
              <CountUnit value={countdown.days} label="Days" />
              <div
                style={{
                  color: "rgba(255,255,255,0.15)",
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "1.2rem",
                  paddingBottom: "0.4rem",
                }}
              >
                :
              </div>
              <CountUnit value={countdown.hours} label="Hrs" />
              <div
                style={{
                  color: "rgba(255,255,255,0.15)",
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "1.2rem",
                  paddingBottom: "0.4rem",
                }}
              >
                :
              </div>
              <CountUnit value={countdown.minutes} label="Min" />
            </div>
          )}

          {countdown.past && (
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.4rem 0.8rem",
              }}
            >
              Race Concluded
            </div>
          )}
        </div>
      </div>

      {/* Bottom edge line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 40%, transparent 70%)",
          zIndex: 3,
        }}
      />
      {/* Corner accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "60%",
          background: "linear-gradient(180deg, #E10600 0%, transparent 100%)",
          zIndex: 3,
        }}
      />

      <style>{`
        @keyframes heroSlideUp    { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroFadeIn     { from { opacity: 0; } to { opacity: 1; } }
        @keyframes heroSpeedLine  { 0% { transform: translateX(-10%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(120vw); opacity: 0; } }
        @keyframes heroPulse      { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.85); opacity: 0.7; } }
        @keyframes heroPulseRing  { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>
    </section>
  );
}
