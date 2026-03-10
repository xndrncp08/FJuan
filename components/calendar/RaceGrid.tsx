"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface RaceGridProps {
  races: any[];
  season: string;
  currentYear: number;
}

// Live countdown hook
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;
    const target = targetDate.getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  return timeLeft;
}

function RaceCard({
  race,
  season,
  isNext,
  isPast,
}: {
  race: any;
  season: string;
  isNext: boolean;
  isPast: boolean;
}) {
  // Use race date (last day of weekend) as the canonical date
  const raceDate = new Date(race.date);

  // Get practice/quali dates if available to show weekend span
  const fp1Date = race.FirstPractice?.date
    ? new Date(race.FirstPractice.date)
    : null;
  const qualiDate = race.Qualifying?.date
    ? new Date(race.Qualifying.date)
    : null;

  // Weekend: from FP1 (or Thursday) to race day
  const weekendStart = fp1Date || raceDate;
  const sameMonth = weekendStart.getMonth() === raceDate.getMonth();

  const weekendLabel = sameMonth
    ? `${weekendStart.getDate()}–${raceDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
    : `${weekendStart.toLocaleDateString("en-US", { day: "numeric", month: "short" })} – ${raceDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;

  const countdown = useCountdown(isNext ? raceDate : null);

  const cardContent = (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: isNext ? "#111" : isPast ? "#0d0d0d" : "#111",
        height: "100%",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          height: "2px",
          background: isNext
            ? "#E10600"
            : isPast
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.1)",
        }}
      />

      {/* Round watermark */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1.25rem",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "5rem",
          color: "rgba(255,255,255,0.03)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {race.round}
      </div>

      <div style={{ padding: "1.5rem", position: "relative" }}>
        {/* Round badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginBottom: "1rem",
            padding: "0.2rem 0.6rem",
            background: isNext ? "rgba(225,6,0,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isNext ? "rgba(225,6,0,0.25)" : "rgba(255,255,255,0.07)"}`,
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: isNext ? "#E10600" : "rgba(255,255,255,0.3)",
            }}
          >
            {isNext ? "▶ NEXT · " : ""}Round {race.round}
          </span>
        </div>

        {/* Race name + location */}
        <h3
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "1.05rem",
            textTransform: "uppercase",
            lineHeight: 1.05,
            color: "white",
            margin: "0 0 0.2rem",
          }}
        >
          {race.raceName}
        </h3>
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 500,
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.35)",
            margin: "0 0 1.25rem",
            letterSpacing: "0.04em",
          }}
        >
          {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
        </p>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.06)",
            marginBottom: "1.25rem",
          }}
        />

        {/* Date block */}
        <div style={{ marginBottom: isNext ? "1.25rem" : "0" }}>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.6rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "0.25rem",
            }}
          >
            Race Weekend
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {weekendLabel}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.25)",
              marginTop: "2px",
            }}
          >
            Race:{" "}
            {raceDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          {qualiDate && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.2)",
                marginTop: "1px",
              }}
            >
              Qualifying:{" "}
              {qualiDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Countdown for next race */}
        {isNext && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {[
              { label: "Days", value: countdown.days },
              { label: "Hrs", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((t) => (
              <div
                key={t.label}
                style={{
                  background: "#0a0a0a",
                  padding: "0.6rem 0.5rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "1.4rem",
                    color: "#E10600",
                    lineHeight: 1,
                  }}
                >
                  {String(t.value).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.55rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "2px",
                  }}
                >
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past race CTA */}
        {isPast && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              Results →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return isPast ? (
    <Link
      href={`/races/${season}/${race.round}`}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      {cardContent}
    </Link>
  ) : (
    <div style={{ height: "100%" }}>{cardContent}</div>
  );
}

export default function RaceGrid({
  races,
  season,
  currentYear,
}: RaceGridProps) {
  const now = new Date();
  const isCurrentSeason = season === currentYear.toString();

  // Find the next upcoming race
  const nextRaceIndex = isCurrentSeason
    ? races.findIndex((r) => new Date(r.date) > now)
    : -1;

  if (races.length === 0) {
    return (
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#111",
        }}
      >
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          No races scheduled for {season}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "2rem 1.5rem 3rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRight: "none",
          borderBottom: "none",
        }}
      >
        {races.map((race: any, index: number) => {
          const raceDate = new Date(race.date);
          const isPast = raceDate < now || !isCurrentSeason;
          const isNext = index === nextRaceIndex;
          return (
            <RaceCard
              key={race.round}
              race={race}
              season={season}
              isNext={isNext}
              isPast={isPast}
            />
          );
        })}
      </div>
    </div>
  );
}
