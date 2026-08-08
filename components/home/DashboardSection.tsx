/**
 * components/home/DashboardSection.tsx
 *
 * FJuanDASH "Pit Wall" dashboard.
 *
 * This component combines three key pieces of race intelligence:
 *
 * 1. Championship standings
 *    - Displays the top eight drivers.
 *    - Shows championship points.
 *    - Provides a visual points comparison.
 *
 * 2. Next race
 *    - Displays the upcoming race and circuit.
 *    - Shows the country and locality.
 *    - Provides a live countdown to race start.
 *
 * 3. Prediction engine
 *    - Displays the top three predicted podium finishers.
 *    - Visualizes podium probabilities.
 *
 * Responsive layout:
 * - Desktop: two-column bento layout.
 * - Tablet: single-column layout.
 * - Mobile: compact spacing and typography.
 *
 * The component is client-side because the countdown requires
 * browser timing APIs and React state.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
} from "recharts";

/**
 * Data provided by the parent dashboard page.
 *
 * These are currently typed as `any` because the API response
 * models are defined outside this component. These should
 * eventually be replaced with shared TypeScript interfaces.
 */
interface DashboardSectionProps {
  standings: any[];
  nextRace: any;
  prediction: any;
}

/**
 * Centralized dashboard color tokens.
 *
 * Keeping the dashboard palette here ensures the charts,
 * UI elements, and CSS share the same visual language.
 */
const COLORS = {
  black: "#050202",
  dark: "#0B0302",
  panel: "#100504",
  panelLight: "#180705",
  wine: "#280905",
  red: "#740A03",
  primary: "#C3110C",
  orange: "#E6501B",
  white: "#F5F1ED",
  muted: "rgba(245,241,237,0.48)",
  faint: "rgba(245,241,237,0.18)",
  line: "rgba(230,80,27,0.16)",
};

/**
 * Colors used for the three predicted podium positions.
 *
 * Index 0 = P1
 * Index 1 = P2
 * Index 2 = P3
 */
const PODIUM_COLORS = ["#E6501B", "#C3110C", "#740A03"];

/**
 * Live race countdown hook.
 *
 * Calculates the time remaining between the current time
 * and the supplied target date.
 *
 * The countdown updates every second while the target is
 * still in the future.
 *
 * The interval is cleaned up when the component unmounts
 * or when the target date changes.
 */
function useCountdown(target: Date | null) {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!target) return;

    const update = () => {
      const difference = target.getTime() - Date.now();

      // Prevent the countdown from displaying negative values.
      if (difference <= 0) {
        setTime({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      // Convert the remaining milliseconds into readable units.
      setTime({
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference % 86400000) / 3600000),
        minutes: Math.floor((difference % 3600000) / 60000),
        seconds: Math.floor((difference % 60000) / 1000),
      });
    };

    // Run immediately so the UI has a value before the
    // first one-second interval completes.
    update();

    const interval = setInterval(update, 1000);

    // Clean up the interval when the component changes
    // or is removed from the page.
    return () => clearInterval(interval);
  }, [target?.getTime()]);

  return time;
}

/**
 * Shared header used by all dashboard panels.
 *
 * Provides a consistent eyebrow, title, and optional
 * contextual action label.
 */
function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="dashboard-header">
      <div>
        <div className="dashboard-eyebrow">
          <span />
          {eyebrow}
        </div>

        <h2>{title}</h2>
      </div>

      {action && <span className="dashboard-action">{action}</span>}
    </div>
  );
}

/**
 * Championship standings panel.
 *
 * Displays the current top eight drivers and compares
 * each driver's points against the championship leader.
 */
function StandingsPanel({ standings }: { standings: any[] }) {
  // The dashboard intentionally limits the list to eight drivers.
  const drivers = standings.slice(0, 8);

  // Used as the reference point for each driver's progress bar.
  // Defaulting to 1 prevents division by zero.
  const leaderPoints = Number(drivers[0]?.points) || 1;

  // Transform the API data into the format expected by Recharts.
  const chartData = drivers.map((driver: any) => ({
    points: Number(driver.points) || 0,
  }));

  return (
    <div className="standings-panel">
      <SectionHeader
        eyebrow="01 / Championship"
        title="Driver standings"
        action="Top 8"
      />

      {/* Decorative points chart positioned behind the standings list. */}
      <div className="standings-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="standingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={COLORS.orange}
                  stopOpacity={0.24}
                />

                <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="points"
              stroke={COLORS.orange}
              strokeWidth={1.5}
              fill="url(#standingsFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Driver standings list. */}
      <div className="standings-list">
        {drivers.map((driver: any, index: number) => {
          const points = Number(driver.points) || 0;

          // Calculate points relative to the championship leader.
          const percentage = (points / leaderPoints) * 100;

          return (
            <div className="standing-row" key={driver.Driver?.driverId}>
              <div
                className={`standing-position ${index < 3 ? "is-podium" : ""}`}
              >
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="standing-driver">
                <div className="standing-name">
                  {driver.Driver?.givenName}{" "}
                  <strong>{driver.Driver?.familyName}</strong>
                </div>

                <div className="standing-team">
                  {driver.Constructors?.[0]?.name ?? "Unknown constructor"}
                </div>

                <div className="standing-progress">
                  <span
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="standing-points">
                {points}
                <small>PTS</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigate to the complete driver standings page. */}
      <Link className="dashboard-link" href="/drivers">
        <span>View full standings</span>
        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Upcoming race panel.
 *
 * Builds the target race date and feeds it into the countdown hook.
 *
 * The current implementation assumes the race begins at 15:00 UTC
 * because only the race date is being consumed here.
 *
 * If the API exposes an actual race start time, this should be
 * replaced with that value.
 */
function NextRacePanel({ nextRace }: { nextRace: any }) {
  const raceDate = nextRace ? new Date(`${nextRace.date}T15:00:00Z`) : null;

  const countdown = useCountdown(raceDate);

  return (
    <div className="race-panel">
      <SectionHeader
        eyebrow="02 / Next event"
        title="Race weekend"
        action={`R${nextRace?.round ?? "—"}`}
      />

      <div className="race-content">
        <div className="race-location">
          <span>{nextRace?.Circuit?.Location?.country ?? "TBD"}</span>

          <span className="race-dot" />

          <span>
            {nextRace?.Circuit?.Location?.locality ?? "Circuit unknown"}
          </span>
        </div>

        <h3>{nextRace?.raceName ?? "Season concluded"}</h3>

        <p className="race-circuit">
          {nextRace?.Circuit?.circuitName ?? "Circuit information unavailable"}
        </p>

        {nextRace && (
          <>
            <div className="countdown-label">Lights out in</div>

            <div className="countdown">
              {[
                {
                  value: countdown.days,
                  label: "Days",
                },
                {
                  value: countdown.hours,
                  label: "Hours",
                },
                {
                  value: countdown.minutes,
                  label: "Minutes",
                },
                {
                  value: countdown.seconds,
                  label: "Seconds",
                },
              ].map((item) => (
                <div className="countdown-cell" key={item.label}>
                  <strong>{String(item.value).padStart(2, "0")}</strong>

                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigate to the full race calendar. */}
      <Link className="dashboard-link" href="/calendar">
        <span>Explore race calendar</span>
        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Prediction-engine panel.
 *
 * Displays the top three predicted podium finishers and
 * their calculated podium probabilities.
 *
 * When no prediction data is available, the component
 * renders a dedicated fallback state instead of an empty chart.
 */
function PredictionPanel({
  prediction,
  nextRace,
}: {
  prediction: any;
  nextRace: any;
}) {
  // Only the top three predictions are relevant to the podium.
  const drivers = prediction?.predictions?.slice(0, 3) ?? [];

  // Graceful fallback for missing prediction data.
  if (!drivers.length) {
    return (
      <div className="prediction-panel">
        <SectionHeader
          eyebrow="03 / Prediction engine"
          title="Race prediction"
          action="Unavailable"
        />

        <div className="prediction-empty">
          <span>Prediction unavailable</span>
        </div>
      </div>
    );
  }

  /**
   * Convert prediction results into the data structure
   * required by Recharts.
   */
  const chartData = drivers.map((driver: any, index: number) => ({
    name: driver.familyName,
    probability: Number(driver.podiumProbability) || 0,
    color: PODIUM_COLORS[index],
  }));

  return (
    <div className="prediction-panel">
      <SectionHeader
        eyebrow="03 / Prediction engine"
        title="Race prediction"
        action={prediction.raceName ?? nextRace?.raceName ?? "Next race"}
      />

      <div className="prediction-content">
        {/* Compact visualization of podium probabilities. */}
        <div className="prediction-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="18%">
              <Bar dataKey="probability" radius={0}>
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    fillOpacity={index === 0 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed prediction results. */}
        <div className="prediction-list">
          {drivers.map((driver: any, index: number) => (
            <div className="prediction-row" key={driver.driverId}>
              <div
                className="prediction-rank"
                style={{
                  color: PODIUM_COLORS[index],
                }}
              >
                P{index + 1}
              </div>

              <div className="prediction-driver">
                <strong>
                  {driver.givenName?.charAt(0)}. {driver.familyName}
                </strong>

                <span>{driver.constructorName}</span>
              </div>

              <div className="prediction-probability">
                <strong>{driver.podiumProbability}%</strong>

                <span>probability</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigate to the full prediction model. */}
      <Link className="dashboard-link" href="/predict">
        <span>Open prediction model</span>
        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Main FJuanDASH dashboard section.
 *
 * The layout is intentionally kept separate from the individual
 * panel components so each panel can remain focused on its own
 * data and presentation logic.
 */
export default function DashboardSection({
  standings,
  nextRace,
  prediction,
}: DashboardSectionProps) {
  return (
    <section className="dashboard-section">
      {/*
       * Dashboard styles are colocated with the component.
       *
       * Desktop:
       * - Two-column bento grid.
       * - Standings span both rows.
       *
       * Tablet:
       * - Panels collapse into one column.
       *
       * Mobile:
       * - Reduced shell width and spacing.
       * - Smaller typography and chart heights.
       *
       * Accessibility:
       * - Reduced-motion media query disables non-essential
       *   transitions for users who prefer reduced motion.
       */}
      <style>{`
        .dashboard-section {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(195,17,12,0.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 90%,
              rgba(230,80,27,0.07),
              transparent 25%
            ),
            ${COLORS.black};
          color: ${COLORS.white};
        }

        .dashboard-section::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.25;
          background-image:
            linear-gradient(
              rgba(230,80,27,0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(230,80,27,0.025) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
        }

        .dashboard-shell {
          position: relative;
          z-index: 1;
          width: min(1380px, calc(100% - 48px));
          margin: 0 auto;
          padding: clamp(5rem, 9vw, 9rem) 0;
        }

        .dashboard-intro {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: end;
          margin-bottom: clamp(3rem, 6vw, 5.5rem);
        }

        .dashboard-intro-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${COLORS.orange};
        }

        .dashboard-intro-label::before {
          content: "";
          width: 28px;
          height: 2px;
          background: ${COLORS.orange};
        }

        .dashboard-intro h1 {
          max-width: 720px;
          margin: 0;
          font-family: "Russo One", sans-serif;
          font-size: clamp(2.8rem, 7vw, 7rem);
          line-height: 0.88;
          letter-spacing: -0.055em;
          text-transform: uppercase;
        }

        .dashboard-intro h1 span {
          color: ${COLORS.primary};
        }

        .dashboard-intro-copy {
          max-width: 420px;
          margin-left: auto;
          font-family: "Rajdhani", sans-serif;
          font-size: clamp(0.95rem, 1.4vw, 1.1rem);
          line-height: 1.5;
          color: ${COLORS.muted};
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          grid-template-rows: auto auto;
          gap: 2px;
          background: ${COLORS.line};
        }

        .dashboard-card {
          position: relative;
          overflow: hidden;
          background: ${COLORS.panel};
          border: 1px solid rgba(230,80,27,0.08);
        }

        .dashboard-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 72px;
          height: 3px;
          background: ${COLORS.orange};
        }

        .dashboard-standings {
          grid-row: 1 / 3;
        }

        .dashboard-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(245,241,237,0.06);
        }

        .dashboard-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 0.55rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.5rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${COLORS.orange};
        }

        .dashboard-eyebrow span {
          width: 5px;
          height: 5px;
          background: ${COLORS.orange};
        }

        .dashboard-header h2 {
          margin: 0;
          font-family: "Russo One", sans-serif;
          font-size: clamp(1.2rem, 2vw, 1.65rem);
          line-height: 1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
        }

        .dashboard-action {
          max-width: 150px;
          overflow: hidden;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.48rem;
          letter-spacing: 0.12em;
          text-align: right;
          text-transform: uppercase;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: ${COLORS.faint};
        }

        .standings-panel,
        .race-panel,
        .prediction-panel {
          display: flex;
          min-height: 100%;
          flex-direction: column;
        }

        .standings-chart {
          position: absolute;
          inset: 75px 0 auto;
          height: 220px;
          opacity: 0.22;
          pointer-events: none;
        }

        .standings-list {
          position: relative;
          z-index: 1;
          padding: 0.5rem 0;
        }

        .standing-row {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) auto;
          gap: 1rem;
          align-items: center;
          min-height: 72px;
          padding: 0.7rem 1.5rem;
          border-bottom: 1px solid rgba(245,241,237,0.045);
          transition:
            background 180ms ease,
            padding 180ms ease;
        }

        .standing-row:hover {
          padding-left: 1.7rem;
          background: rgba(195,17,12,0.06);
        }

        .standing-position {
          font-family: "Russo One", sans-serif;
          font-size: 0.85rem;
          color: ${COLORS.faint};
        }

        .standing-position.is-podium {
          color: ${COLORS.orange};
          font-size: 1rem;
        }

        .standing-driver {
          min-width: 0;
        }

        .standing-name {
          overflow: hidden;
          margin-bottom: 3px;
          font-family: "Russo One", sans-serif;
          font-size: clamp(0.8rem, 1.6vw, 1rem);
          letter-spacing: -0.02em;
          text-transform: uppercase;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .standing-name strong {
          color: ${COLORS.orange};
        }

        .standing-team {
          overflow: hidden;
          margin-bottom: 8px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.45rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: ${COLORS.faint};
        }

        .standing-progress {
          height: 2px;
          overflow: hidden;
          background: rgba(245,241,237,0.06);
        }

        .standing-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(
            90deg,
            ${COLORS.red},
            ${COLORS.orange}
          );
        }

        .standing-points {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          font-family: "Russo One", sans-serif;
          font-size: clamp(1rem, 2vw, 1.35rem);
          line-height: 1;
        }

        .standing-points small {
          margin-bottom: 1px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.38rem;
          letter-spacing: 0.08em;
          color: ${COLORS.faint};
        }

        .race-content {
          flex: 1;
          padding: 2rem 1.5rem;
        }

        .race-location {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.47rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${COLORS.orange};
        }

        .race-dot {
          width: 3px;
          height: 3px;
          background: ${COLORS.faint};
        }

        .race-content h3 {
          max-width: 550px;
          margin: 0;
          font-family: "Russo One", sans-serif;
          font-size: clamp(1.7rem, 4vw, 3rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .race-circuit {
          margin: 0.75rem 0 2rem;
          font-family: "Rajdhani", sans-serif;
          font-size: 0.9rem;
          color: ${COLORS.muted};
        }

        .countdown-label {
          margin-bottom: 0.6rem;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.45rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .countdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(230,80,27,0.1);
        }

        .countdown-cell {
          min-width: 0;
          padding: 0.8rem 0.4rem;
          text-align: center;
          background: ${COLORS.dark};
        }

        .countdown-cell strong {
          display: block;
          font-family: "Russo One", sans-serif;
          font-size: clamp(1rem, 3vw, 1.7rem);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .countdown-cell span {
          display: block;
          margin-top: 5px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.38rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .prediction-content {
          flex: 1;
          padding: 1.5rem;
        }

        .prediction-chart {
          height: 78px;
          margin-bottom: 1.1rem;
        }

        .prediction-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .prediction-row {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          gap: 0.75rem;
          align-items: center;
          min-height: 58px;
          padding: 0.65rem 0.75rem;
          background: rgba(245,241,237,0.025);
          border-left: 2px solid ${COLORS.red};
          transition: background 180ms ease;
        }

        .prediction-row:first-child {
          background: rgba(230,80,27,0.06);
          border-left-color: ${COLORS.orange};
        }

        .prediction-row:hover {
          background: rgba(230,80,27,0.09);
        }

        .prediction-rank {
          font-family: "Russo One", sans-serif;
          font-size: 0.85rem;
        }

        .prediction-driver {
          min-width: 0;
        }

        .prediction-driver strong {
          display: block;
          overflow: hidden;
          font-family: "Russo One", sans-serif;
          font-size: clamp(0.7rem, 1.5vw, 0.9rem);
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .prediction-driver span {
          display: block;
          overflow: hidden;
          margin-top: 3px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.4rem;
          letter-spacing: 0.08em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
          color: ${COLORS.faint};
        }

        .prediction-probability {
          text-align: right;
        }

        .prediction-probability strong {
          display: block;
          font-family: "Russo One", sans-serif;
          font-size: 0.95rem;
        }

        .prediction-probability span {
          display: block;
          margin-top: 2px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.35rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .prediction-empty {
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .dashboard-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 0 1.5rem;
          border-top: 1px solid rgba(245,241,237,0.06);
          font-family: "JetBrains Mono", monospace;
          font-size: 0.45rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-decoration: none;
          text-transform: uppercase;
          color: ${COLORS.muted};
          transition:
            color 180ms ease,
            background 180ms ease;
        }

        .dashboard-link:hover {
          color: ${COLORS.white};
          background: rgba(195,17,12,0.08);
        }

        .dashboard-arrow {
          font-size: 0.85rem;
          color: ${COLORS.orange};
        }

        @media (max-width: 900px) {
          .dashboard-intro {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .dashboard-intro-copy {
            margin-left: 0;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }

          .dashboard-standings {
            grid-row: auto;
          }
        }

        @media (max-width: 640px) {
          .dashboard-shell {
            width: min(100% - 28px, 1380px);
            padding: 4.5rem 0;
          }

          .dashboard-intro {
            margin-bottom: 2.5rem;
          }

          .dashboard-intro h1 {
            font-size: clamp(2.6rem, 15vw, 5rem);
          }

          .dashboard-intro-copy {
            font-size: 0.9rem;
          }

          .dashboard-header {
            padding: 1.2rem 1rem;
          }

          .standing-row {
            grid-template-columns: 32px minmax(0, 1fr) auto;
            gap: 0.65rem;
            min-height: 66px;
            padding: 0.65rem 1rem;
          }

          .standing-team {
            font-size: 0.38rem;
          }

          .standing-points small {
            display: none;
          }

          .race-content,
          .prediction-content {
            padding: 1.25rem 1rem;
          }

          .race-content h3 {
            font-size: clamp(1.6rem, 9vw, 2.4rem);
          }

          .countdown-cell {
            padding: 0.7rem 0.2rem;
          }

          .countdown-cell strong {
            font-size: 1rem;
          }

          .prediction-chart {
            height: 58px;
          }

          .prediction-row {
            grid-template-columns: 35px minmax(0, 1fr) auto;
            min-height: 54px;
          }

          .dashboard-link {
            padding: 0 1rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .standing-row,
          .prediction-row,
          .dashboard-link {
            transition: none;
          }
        }
      `}</style>

      <div className="dashboard-shell">
        <div className="dashboard-intro">
          <div>
            <div className="dashboard-intro-label">FJuanDASH / Live data</div>

            <h1>
              The <span>race</span>
              <br />
              starts here.
            </h1>
          </div>

          <p className="dashboard-intro-copy">
            Championship standings, the next race and the prediction engine.
            Everything that matters before the lights go out, presented in one
            place.
          </p>
        </div>

        <div className="dashboard-grid">
          {/*
           * Standings are the primary dashboard panel.
           *
           * On desktop this panel spans both rows of the
           * bento grid. On smaller screens it becomes a
           * normal single-column card.
           */}
          <div className="dashboard-card dashboard-standings">
            {standings?.length ? (
              <StandingsPanel standings={standings} />
            ) : (
              <div className="prediction-empty">
                <span>Standings unavailable</span>
              </div>
            )}
          </div>

          {/* Upcoming race information and countdown. */}
          <div className="dashboard-card">
            <NextRacePanel nextRace={nextRace} />
          </div>

          {/* Prediction-engine podium analysis. */}
          <div className="dashboard-card">
            <PredictionPanel prediction={prediction} nextRace={nextRace} />
          </div>
        </div>
      </div>
    </section>
  );
}
