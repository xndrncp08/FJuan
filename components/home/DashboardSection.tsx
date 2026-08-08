/**
 * components/home/DashboardSection.tsx
 *
 * FJuanDASH "Pit Wall" dashboard section.
 *
 * Responsibilities:
 * - Display the current driver standings.
 * - Visualize championship points with a subtle area chart.
 * - Display the next scheduled race and countdown timer.
 * - Display the prediction engine's top three podium probabilities.
 * - Provide responsive layouts for desktop, tablet, and mobile.
 * - Add Framer Motion entrance and hover animations.
 *
 * Design direction:
 * - Dark motorsport-inspired interface.
 * - Red/orange F1-style accent palette.
 * - Technical grid overlays and telemetry-inspired graphics.
 * - Dense information hierarchy without looking like a traditional admin
 *   dashboard.
 *
 * Dependencies:
 * - recharts
 * - framer-motion
 * - next/link
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
} from "recharts";

/**
 * Props supplied by the home page.
 *
 * `any` is intentionally retained here because the data comes from the
 * existing F1 API layer and may contain slightly different shapes depending
 * on the endpoint response.
 */
interface DashboardSectionProps {
  standings: any[];
  nextRace: any;
  prediction: any;
}

/**
 * Dashboard design tokens.
 *
 * Keeping these values centralized makes it easier to maintain the visual
 * identity of the dashboard without scattering color values throughout
 * the stylesheet.
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
 * Podium colors used by the prediction chart and ranking labels.
 */
const PODIUM_COLORS = [COLORS.orange, COLORS.primary, COLORS.red];

/**
 * Framer Motion variants for dashboard cards.
 *
 * `ease: "easeOut"` is intentionally used instead of a cubic-bezier array.
 * This prevents TypeScript from inferring the easing array as `number[]`,
 * which causes a `Variants` type incompatibility with some Framer Motion
 * versions.
 */
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.98,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for individual standings and prediction rows.
 */
const rowVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -18,
  },

  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

/**
 * Variants for the dashboard introduction.
 */
const introVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

/**
 * Generates a live countdown between now and a target date.
 *
 * The countdown updates every second and automatically cleans up its
 * interval when the component unmounts or the target changes.
 */
function useCountdown(target: Date | null) {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!target) {
      return;
    }

    const update = () => {
      const difference = target.getTime() - Date.now();

      /**
       * Once the target has passed, keep the timer at zero rather than
       * displaying negative values.
       */
      if (difference <= 0) {
        setTime({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      setTime({
        days: Math.floor(difference / 86400000),

        hours: Math.floor((difference % 86400000) / 3600000),

        minutes: Math.floor((difference % 3600000) / 60000),

        seconds: Math.floor((difference % 60000) / 1000),
      });
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [target?.getTime()]);

  return time;
}

/**
 * Shared header used by all dashboard panels.
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
 * Displays:
 * - Top eight drivers.
 * - Driver position.
 * - Driver name and constructor.
 * - Relative points progress.
 * - Championship points.
 * - A subtle area chart behind the standings.
 */
function StandingsPanel({ standings }: { standings: any[] }) {
  const drivers = standings.slice(0, 8);

  const leaderPoints = Number(drivers[0]?.points) || 1;

  /**
   * Chart data intentionally only contains points.
   * The chart acts as a visual background rather than a
   * conventional data visualization.
   */
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

      {/* Decorative telemetry-style chart */}
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
              isAnimationActive
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="standings-list">
        {drivers.map((driver: any, index: number) => {
          const points = Number(driver.points) || 0;

          const percentage = (points / leaderPoints) * 100;

          return (
            <motion.div
              className="standing-row"
              key={
                driver.Driver?.driverId ??
                `${driver.Driver?.familyName}-${index}`
              }
              variants={rowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                delay: index * 0.045,
              }}
            >
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
                  <motion.span
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${percentage}%`,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.06,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>

              <div className="standing-points">
                {points}

                <small>PTS</small>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Link className="dashboard-link" href="/drivers">
        <span>View full standings</span>

        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Next race panel.
 *
 * Converts the API race date into a Date object and feeds it
 * into the live countdown hook.
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

        <motion.h3
          initial={{
            opacity: 0,
            x: -20,
          }}
          whileInView={{
            opacity: 1,
            x: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.55,
            ease: "easeOut",
          }}
        >
          {nextRace?.raceName ?? "Season concluded"}
        </motion.h3>

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
              ].map((item, index) => (
                <motion.div
                  className="countdown-cell"
                  key={item.label}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <strong>{String(item.value).padStart(2, "0")}</strong>

                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <Link className="dashboard-link" href="/calendar">
        <span>Explore race calendar</span>

        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Prediction engine panel.
 *
 * Displays the three drivers with the highest predicted
 * podium probability for the upcoming race.
 */
function PredictionPanel({
  prediction,
  nextRace,
}: {
  prediction: any;
  nextRace: any;
}) {
  const drivers = prediction?.predictions?.slice(0, 3) ?? [];

  /**
   * Graceful fallback when the prediction engine has
   * not produced a result.
   */
  if (!drivers.length) {
    return (
      <div className="prediction-panel">
        <SectionHeader
          eyebrow="03 / Prediction engine"
          title="Race prediction"
          action="Offline"
        />

        <div className="prediction-empty">
          <div>
            <span>Prediction unavailable</span>

            <small>Model data is not currently available.</small>
          </div>
        </div>

        <Link className="dashboard-link" href="/predict">
          <span>Open prediction model</span>

          <span className="dashboard-arrow">↗</span>
        </Link>
      </div>
    );
  }

  /**
   * Chart data used for the podium probability
   * visualization.
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
        <div className="prediction-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="18%">
              <Bar
                dataKey="probability"
                radius={0}
                isAnimationActive
                animationDuration={900}
              >
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

        <div className="prediction-list">
          {drivers.map((driver: any, index: number) => (
            <motion.div
              className="prediction-row"
              key={driver.driverId ?? `${driver.familyName}-${index}`}
              variants={rowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                delay: index * 0.1,
              }}
            >
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
            </motion.div>
          ))}
        </div>
      </div>

      <Link className="dashboard-link" href="/predict">
        <span>Open prediction model</span>

        <span className="dashboard-arrow">↗</span>
      </Link>
    </div>
  );
}

/**
 * Main dashboard section.
 *
 * Desktop:
 * - Large standings panel on the left.
 * - Race panel on the upper right.
 * - Prediction panel on the lower right.
 *
 * Tablet:
 * - Single-column card layout.
 *
 * Mobile:
 * - Compressed spacing and typography.
 * - Preserves the dashboard's technical visual language.
 */
export default function DashboardSection({
  standings,
  nextRace,
  prediction,
}: DashboardSectionProps) {
  return (
    <section className="dashboard-section">
      <style>{`
        /*
         * ============================================================
         * Dashboard foundation
         * ============================================================
         */

        .dashboard-section {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(195, 17, 12, 0.14),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 90%,
              rgba(230, 80, 27, 0.09),
              transparent 25%
            ),
            ${COLORS.black};
          color: ${COLORS.white};
        }

        /*
         * Technical background grid.
         */
        .dashboard-section::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.32;
          background-image:
            linear-gradient(
              rgba(230, 80, 27, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(230, 80, 27, 0.035) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 92%
          );
        }

        /*
         * Large decorative radial target behind the dashboard.
         */
        .dashboard-section::after {
          content: "";
          position: absolute;
          top: 5%;
          right: -12%;
          width: 520px;
          height: 520px;
          border: 1px solid rgba(230, 80, 27, 0.08);
          border-radius: 50%;
          pointer-events: none;
          box-shadow:
            0 0 0 70px rgba(230, 80, 27, 0.018),
            0 0 0 140px rgba(230, 80, 27, 0.012);
        }

        .dashboard-shell {
          position: relative;
          z-index: 1;
          width: min(
            1380px,
            calc(100% - 48px)
          );
          margin: 0 auto;
          padding: clamp(
            5rem,
            9vw,
            9rem
          ) 0;
        }

        /*
         * ============================================================
         * Introduction
         * ============================================================
         */

        .dashboard-intro {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: end;
          margin-bottom: clamp(
            3rem,
            6vw,
            5.5rem
          );
        }

        .dashboard-intro-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
          font-family:
            "JetBrains Mono",
            monospace;
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
          box-shadow:
            0 0 12px
            rgba(230, 80, 27, 0.45);
        }

        .dashboard-intro h1 {
          max-width: 720px;
          margin: 0;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            2.8rem,
            7vw,
            7rem
          );
          line-height: 0.88;
          letter-spacing: -0.055em;
          text-transform: uppercase;
        }

        .dashboard-intro h1 span {
          color: ${COLORS.primary};
          text-shadow:
            0 0 35px
            rgba(195, 17, 12, 0.24);
        }

        .dashboard-intro-copy {
          max-width: 420px;
          margin-left: auto;
          font-family:
            "Rajdhani",
            sans-serif;
          font-size: clamp(
            0.95rem,
            1.4vw,
            1.1rem
          );
          line-height: 1.5;
          color: ${COLORS.muted};
        }

        /*
         * ============================================================
         * Main bento grid
         * ============================================================
         */

        .dashboard-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.25fr)
            minmax(360px, 0.75fr);
          grid-template-rows:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 2px;
          background: ${COLORS.line};
          box-shadow:
            0 30px 100px
            rgba(0, 0, 0, 0.45);
        }

        .dashboard-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          background: ${COLORS.panel};
          border: 1px solid
            rgba(230, 80, 27, 0.08);
        }

        /*
         * Internal technical grid for every card.
         */
        .dashboard-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.55;
          background-image:
            linear-gradient(
              rgba(245, 241, 237, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(245, 241, 237, 0.025) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 80%
          );
        }

        /*
         * Orange race-control accent line.
         */
        .dashboard-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 72px;
          height: 3px;
          background: ${COLORS.orange};
          box-shadow:
            0 0 18px
            rgba(230, 80, 27, 0.3);
          z-index: 5;
        }

        .dashboard-standings {
          grid-row: 1 / 3;
        }

        /*
         * ============================================================
         * Shared card header
         * ============================================================
         */

        .dashboard-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem
            1.5rem
            1.25rem;
          border-bottom: 1px solid
            rgba(245, 241, 237, 0.06);
        }

        .dashboard-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 0.55rem;
          font-family:
            "JetBrains Mono",
            monospace;
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
          box-shadow:
            0 0 8px
            rgba(230, 80, 27, 0.6);
        }

        .dashboard-header h2 {
          margin: 0;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            1.2rem,
            2vw,
            1.65rem
          );
          line-height: 1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
        }

        .dashboard-action {
          max-width: 150px;
          overflow: hidden;
          font-family:
            "JetBrains Mono",
            monospace;
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

        /*
         * ============================================================
         * Standings
         * ============================================================
         */

        .standings-chart {
          position: absolute;
          inset: 75px 0 auto;
          height: 220px;
          opacity: 0.22;
          pointer-events: none;
          z-index: 0;
        }

        .standings-list {
          position: relative;
          z-index: 1;
          padding: 0.5rem 0;
        }

        .standing-row {
          display: grid;
          grid-template-columns:
            46px
            minmax(0, 1fr)
            auto;
          gap: 1rem;
          align-items: center;
          min-height: 72px;
          padding: 0.7rem 1.5rem;
          border-bottom: 1px solid
            rgba(245, 241, 237, 0.045);
          transition:
            background 180ms ease,
            padding 180ms ease;
        }

        .standing-row:hover {
          padding-left: 1.7rem;
          background:
            linear-gradient(
              90deg,
              rgba(195, 17, 12, 0.1),
              transparent
            );
        }

        .standing-position {
          font-family:
            "Russo One",
            sans-serif;
          font-size: 0.85rem;
          color: ${COLORS.faint};
        }

        .standing-position.is-podium {
          color: ${COLORS.orange};
          font-size: 1rem;
          text-shadow:
            0 0 12px
            rgba(230, 80, 27, 0.25);
        }

        .standing-driver {
          min-width: 0;
        }

        .standing-name {
          overflow: hidden;
          margin-bottom: 3px;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            0.8rem,
            1.6vw,
            1rem
          );
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
          font-family:
            "JetBrains Mono",
            monospace;
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
          background:
            rgba(245, 241, 237, 0.06);
        }

        .standing-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(
            90deg,
            ${COLORS.red},
            ${COLORS.orange}
          );
          box-shadow:
            0 0 8px
            rgba(230, 80, 27, 0.3);
        }

        .standing-points {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            1rem,
            2vw,
            1.35rem
          );
          line-height: 1;
        }

        .standing-points small {
          margin-bottom: 1px;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.38rem;
          letter-spacing: 0.08em;
          color: ${COLORS.faint};
        }

        /*
         * ============================================================
         * Race panel
         * ============================================================
         */

        .race-content {
          position: relative;
          z-index: 1;
          flex: 1;
          padding: 2rem 1.5rem;
        }

        .race-location {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.47rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${COLORS.orange};
        }

        .race-dot {
          width: 3px;
          height: 3px;
          background: ${COLORS.faint};
          box-shadow:
            0 0 6px
            rgba(230, 80, 27, 0.4);
        }

        .race-content h3 {
          max-width: 550px;
          margin: 0;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            1.7rem,
            4vw,
            3rem
          );
          line-height: 0.9;
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .race-circuit {
          margin: 0.75rem 0 2rem;
          font-family:
            "Rajdhani",
            sans-serif;
          font-size: 0.9rem;
          color: ${COLORS.muted};
        }

        .countdown-label {
          margin-bottom: 0.6rem;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.45rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .countdown {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 1px;
          background:
            rgba(230, 80, 27, 0.1);
        }

        .countdown-cell {
          min-width: 0;
          padding: 0.8rem 0.4rem;
          text-align: center;
          background: ${COLORS.dark};
        }

        .countdown-cell strong {
          display: block;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            1rem,
            3vw,
            1.7rem
          );
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .countdown-cell span {
          display: block;
          margin-top: 5px;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.38rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        /*
         * ============================================================
         * Prediction panel
         * ============================================================
         */

        .prediction-content {
          position: relative;
          z-index: 1;
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
          grid-template-columns:
            42px
            minmax(0, 1fr)
            auto;
          gap: 0.75rem;
          align-items: center;
          min-height: 58px;
          padding: 0.65rem 0.75rem;
          background:
            rgba(245, 241, 237, 0.025);
          border-left: 2px solid
            ${COLORS.red};
          transition:
            background 180ms ease,
            transform 180ms ease;
        }

        .prediction-row:first-child {
          background:
            rgba(230, 80, 27, 0.06);
          border-left-color:
            ${COLORS.orange};
        }

        .prediction-row:hover {
          background:
            rgba(230, 80, 27, 0.09);
          transform: translateX(3px);
        }

        .prediction-rank {
          font-family:
            "Russo One",
            sans-serif;
          font-size: 0.85rem;
        }

        .prediction-driver {
          min-width: 0;
        }

        .prediction-driver strong {
          display: block;
          overflow: hidden;
          font-family:
            "Russo One",
            sans-serif;
          font-size: clamp(
            0.7rem,
            1.5vw,
            0.9rem
          );
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .prediction-driver span {
          display: block;
          overflow: hidden;
          margin-top: 3px;
          font-family:
            "JetBrains Mono",
            monospace;
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
          font-family:
            "Russo One",
            sans-serif;
          font-size: 0.95rem;
        }

        .prediction-probability span {
          display: block;
          margin-top: 2px;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.35rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .prediction-empty {
          position: relative;
          z-index: 1;
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          padding: 2rem;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          text-align: center;
          text-transform: uppercase;
          color: ${COLORS.faint};
        }

        .prediction-empty div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .prediction-empty small {
          font-size: 0.4rem;
          letter-spacing: 0.08em;
          color: rgba(
            245,
            241,
            237,
            0.25
          );
        }

        /*
         * ============================================================
         * Footer links
         * ============================================================
         */

        .dashboard-link {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 0 1.5rem;
          border-top: 1px solid
            rgba(245, 241, 237, 0.06);
          font-family:
            "JetBrains Mono",
            monospace;
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
          background:
            rgba(195, 17, 12, 0.08);
        }

        .dashboard-arrow {
          font-size: 0.85rem;
          color: ${COLORS.orange};
          transition:
            transform 180ms ease;
        }

        .dashboard-link:hover
          .dashboard-arrow {
          transform:
            translate(3px, -3px);
        }

        /*
         * ============================================================
         * Desktop visual details
         * ============================================================
         */

        @media (min-width: 901px) {
          .dashboard-card:nth-child(2)::before {
            background-size: 24px 24px;
          }

          .dashboard-card:nth-child(3)::before {
            background-size: 24px 24px;
          }

          .race-content::after {
            content: "";
            position: absolute;
            right: 2rem;
            bottom: 2rem;
            width: 110px;
            height: 110px;
            border: 1px solid
              rgba(230, 80, 27, 0.08);
            border-radius: 50%;
            pointer-events: none;
          }

          .race-content::before {
            content: "";
            position: absolute;
            right: 57px;
            bottom: 2rem;
            width: 1px;
            height: 110px;
            background:
              rgba(230, 80, 27, 0.08);
            pointer-events: none;
          }
        }

        /*
         * ============================================================
         * Tablet
         * ============================================================
         */

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

          .standings-chart {
            height: 180px;
          }
        }

        /*
         * ============================================================
         * Mobile
         * ============================================================
         */

        @media (max-width: 640px) {
          .dashboard-shell {
            width: min(
              100% - 28px,
              1380px
            );
            padding: 4.5rem 0;
          }

          .dashboard-intro {
            margin-bottom: 2.5rem;
          }

          .dashboard-intro h1 {
            font-size: clamp(
              2.6rem,
              15vw,
              5rem
            );
          }

          .dashboard-intro-copy {
            font-size: 0.9rem;
          }

          .dashboard-grid {
            gap: 1px;
          }

          .dashboard-header {
            padding: 1.2rem 1rem;
          }

          .standing-row {
            grid-template-columns:
              32px
              minmax(0, 1fr)
              auto;
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
            font-size: clamp(
              1.6rem,
              9vw,
              2.4rem
            );
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
            grid-template-columns:
              35px
              minmax(0, 1fr)
              auto;
            min-height: 54px;
          }

          .dashboard-link {
            padding: 0 1rem;
          }

          .dashboard-section::after {
            width: 300px;
            height: 300px;
          }
        }

        /*
         * ============================================================
         * Reduced motion accessibility
         * ============================================================
         */

        @media (prefers-reduced-motion: reduce) {
          .standing-row,
          .prediction-row,
          .dashboard-link,
          .dashboard-arrow {
            transition: none;
          }

          .dashboard-section::after {
            display: none;
          }
        }
      `}</style>

      <div className="dashboard-shell">
        {/* Intro content */}
        <motion.div
          className="dashboard-intro"
          variants={introVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
        >
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
        </motion.div>

        {/* Main dashboard grid */}
        <div className="dashboard-grid">
          {/* Championship standings */}
          <motion.div
            className="dashboard-card dashboard-standings"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.12,
            }}
          >
            {standings?.length ? (
              <StandingsPanel standings={standings} />
            ) : (
              <div className="prediction-empty">
                <div>
                  <span>Standings unavailable</span>

                  <small>Championship data is currently unavailable.</small>
                </div>
              </div>
            )}
          </motion.div>

          {/* Next race */}
          <motion.div
            className="dashboard-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.12,
            }}
            transition={{
              delay: 0.12,
            }}
          >
            <NextRacePanel nextRace={nextRace} />
          </motion.div>

          {/* Prediction engine */}
          <motion.div
            className="dashboard-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.12,
            }}
            transition={{
              delay: 0.2,
            }}
          >
            <PredictionPanel prediction={prediction} nextRace={nextRace} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
