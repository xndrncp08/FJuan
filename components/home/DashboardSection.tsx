/**
 * components/home/DashboardSection.tsx
 *
 * "Pit Wall" dashboard section — driver standings, next race countdown, and
 * prediction engine output in one bento grid.
 *
 * Colors are sourced from lib/theme/palette.ts (the same file HeroSection,
 * LastRaceSection, and NewsSection use), so this section stays visually
 * aligned with the rest of the page. The COLORS object below keeps the
 * same key names used throughout the component's CSS-in-JS so nothing
 * downstream needs to change — only where each value comes from.
 *
 * A few extra near-black tones (black/dark/panel/panelLight) exist outside
 * the four brand colors. Those are neutral surface layers for card
 * stacking on a dense dashboard, not part of the brand palette itself.
 *
 * Background: the section's base layer is SECTION_BACKGROUND, the same
 * ink-to-ink gradient used by LastRaceSection and NewsSection. Since it
 * starts and ends on the same INK value, this section's top edge matches
 * whatever section sits above it — no divider needed between them.
 *
 * Responsibilities:
 * - Display current driver standings with a decorative points-area chart.
 * - Display the next scheduled race with a live countdown.
 * - Display the prediction engine's top three podium-probability picks.
 * - Responsive layout: bento grid (desktop) -> stacked cards (tablet/mobile).
 * - Framer Motion entrance and hover animation throughout.
 *
 * Dependencies: recharts, framer-motion, next/link.
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
import {
  INK,
  MAROON,
  RED,
  EMBER,
  PAPER,
  RGB,
  SECTION_BACKGROUND,
} from "@/lib/theme/palette";

/**
 * Props supplied by the home page. `any` is intentionally retained because
 * this data comes from the existing F1 API layer and its shape can vary
 * slightly between endpoints.
 */
interface DashboardSectionProps {
  standings: any[];
  nextRace: any;
  prediction: any;
}

/**
 * Dashboard color tokens. The four brand colors are pulled straight from
 * the shared palette; the near-black neutrals below them exist only for
 * this section's denser card layering and aren't reused elsewhere.
 */
const COLORS = {
  black: "#050202",
  dark: "#0B0302",
  panel: "#100504",
  panelLight: "#180705",
  wine: INK,
  red: MAROON,
  primary: RED,
  orange: EMBER,
  white: PAPER,
  muted: `rgba(${RGB.paper},0.48)`,
  faint: `rgba(${RGB.paper},0.18)`,
  line: `rgba(${RGB.ember},0.16)`,
};

/**
 * Colors for the prediction engine's top-3 bar chart and rank labels.
 * Deliberately a brand-color gradient (ember -> red -> maroon) rather than
 * gold/silver/bronze — this is a *predicted* ranking, not an actual race
 * result, so it's kept visually distinct from LastRaceSection's podium,
 * which uses real medal colors for actual finishing positions.
 */
const PODIUM_COLORS = [COLORS.orange, COLORS.primary, COLORS.red];

/**
 * Framer Motion variants for dashboard cards.
 * `ease: "easeOut"` (a string) is used instead of a cubic-bezier array so
 * TypeScript doesn't infer it as `number[]`, which breaks the `Variants`
 * type on some Framer Motion versions.
 */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

/** Variants for individual standings and prediction rows. */
const rowVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

/** Variants for the dashboard introduction block. */
const introVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/**
 * Live countdown to a target date, updating every second. Cleans up its
 * interval on unmount or when the target changes.
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

      // Once the target has passed, hold at zero rather than going negative.
      if (difference <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

/** Shared header used by all three dashboard panels. */
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
 * Championship standings panel: top 8 drivers, relative points progress,
 * and a decorative area chart layered behind the list.
 */
function StandingsPanel({ standings }: { standings: any[] }) {
  const drivers = standings.slice(0, 8);
  const leaderPoints = Number(drivers[0]?.points) || 1;

  // Chart data intentionally only carries points — the chart is a visual
  // backdrop, not a conventional standalone data visualization.
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
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: index * 0.045 }}
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
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
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

/** Next race panel: location, race name, circuit, and a live countdown. */
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
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
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
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hours" },
                { value: countdown.minutes, label: "Minutes" },
                { value: countdown.seconds, label: "Seconds" },
              ].map((item, index) => (
                <motion.div
                  className="countdown-cell"
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
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

/** Prediction engine panel: top 3 podium-probability picks for the next race. */
function PredictionPanel({
  prediction,
  nextRace,
}: {
  prediction: any;
  nextRace: any;
}) {
  const drivers = prediction?.predictions?.slice(0, 3) ?? [];

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
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="prediction-rank"
                style={{ color: PODIUM_COLORS[index] }}
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
 * Desktop: standings (tall, left) + race panel (upper right) + prediction
 * panel (lower right), as a 2-row bento grid.
 * Tablet/mobile: single-column stacked cards with compressed spacing.
 */
export default function DashboardSection({
  standings,
  nextRace,
  prediction,
}: DashboardSectionProps) {
  return (
    <section className="dashboard-section">
      <style suppressHydrationWarning>{`
        /* Base layer: SECTION_BACKGROUND starts and ends on the same INK
           value used by the sections above/below, so there's no seam at
           either edge. The two radial gradients on top are this section's
           own accent glow. */
        .dashboard-section {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(circle at 8% 10%, rgba(${RGB.red},0.14), transparent 28%),
            radial-gradient(circle at 92% 90%, rgba(${RGB.ember},0.09), transparent 25%),
            ${SECTION_BACKGROUND};
          color: ${COLORS.white};
        }

        /* Technical background grid, fading out toward the bottom. */
        .dashboard-section::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.32;
          background-image:
            linear-gradient(rgba(${RGB.ember},0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${RGB.ember},0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(to bottom, black, transparent 92%);
        }

        /* Large decorative radial target, upper right. */
        .dashboard-section::after {
          content: "";
          position: absolute;
          top: 5%;
          right: -12%;
          width: 520px;
          height: 520px;
          border: 1px solid rgba(${RGB.ember},0.08);
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 0 70px rgba(${RGB.ember},0.018), 0 0 0 140px rgba(${RGB.ember},0.012);
        }

        .dashboard-shell {
          position: relative;
          z-index: 1;
          width: min(1380px, calc(100% - 48px));
          margin: 0 auto;
          padding: clamp(5rem, 9vw, 9rem) 0;
        }

        /* Intro block: eyebrow label, headline, supporting copy. */
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
          box-shadow: 0 0 12px rgba(${RGB.ember},0.45);
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
          text-shadow: 0 0 35px rgba(${RGB.red},0.24);
        }

        .dashboard-intro-copy {
          max-width: 420px;
          margin-left: auto;
          font-family: "Rajdhani", sans-serif;
          font-size: clamp(0.95rem, 1.4vw, 1.1rem);
          line-height: 1.5;
          color: ${COLORS.muted};
        }

        /* Main bento grid: tall standings card on the left, race + prediction
           stacked on the right. */
        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
          gap: 2px;
          background: ${COLORS.line};
          box-shadow: 0 30px 100px rgba(${RGB.ink},0.5);
        }

        .dashboard-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          background: ${COLORS.panel};
          border: 1px solid rgba(${RGB.ember},0.08);
        }

        /* Internal technical grid for every card. */
        .dashboard-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.55;
          background-image:
            linear-gradient(rgba(${RGB.paper},0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${RGB.paper},0.025) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: linear-gradient(to bottom, black, transparent 80%);
        }

        /* Accent line marking the top-left corner of every card. */
        .dashboard-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 72px;
          height: 3px;
          background: ${COLORS.orange};
          box-shadow: 0 0 18px rgba(${RGB.ember},0.3);
          z-index: 5;
        }

        .dashboard-standings {
          grid-row: 1 / 3;
        }

        /* Shared card header: eyebrow, title, right-aligned action label. */
        .dashboard-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(${RGB.paper},0.06);
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
          box-shadow: 0 0 8px rgba(${RGB.ember},0.6);
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

        /* Standings panel */
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
          grid-template-columns: 46px minmax(0, 1fr) auto;
          gap: 1rem;
          align-items: center;
          min-height: 72px;
          padding: 0.7rem 1.5rem;
          border-bottom: 1px solid rgba(${RGB.paper},0.045);
          transition: background 180ms ease, padding 180ms ease;
        }

        .standing-row:hover {
          padding-left: 1.7rem;
          background: linear-gradient(90deg, rgba(${RGB.red},0.1), transparent);
        }

        .standing-position {
          font-family: "Russo One", sans-serif;
          font-size: 0.85rem;
          color: ${COLORS.faint};
        }

        .standing-position.is-podium {
          color: ${COLORS.orange};
          font-size: 1rem;
          text-shadow: 0 0 12px rgba(${RGB.ember},0.25);
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
          background: rgba(${RGB.paper},0.06);
        }

        .standing-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, ${COLORS.red}, ${COLORS.orange});
          box-shadow: 0 0 8px rgba(${RGB.ember},0.3);
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

        /* Race panel */
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
          box-shadow: 0 0 6px rgba(${RGB.ember},0.4);
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
          background: rgba(${RGB.ember},0.1);
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

        /* Prediction panel */
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
          grid-template-columns: 42px minmax(0, 1fr) auto;
          gap: 0.75rem;
          align-items: center;
          min-height: 58px;
          padding: 0.65rem 0.75rem;
          background: rgba(${RGB.paper},0.025);
          border-left: 2px solid ${COLORS.red};
          transition: background 180ms ease, transform 180ms ease;
        }

        .prediction-row:first-child {
          background: rgba(${RGB.ember},0.06);
          border-left-color: ${COLORS.orange};
        }

        .prediction-row:hover {
          background: rgba(${RGB.ember},0.09);
          transform: translateX(3px);
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
          position: relative;
          z-index: 1;
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          padding: 2rem;
          font-family: "JetBrains Mono", monospace;
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
          color: rgba(${RGB.paper},0.25);
        }

        /* Footer links, shared across all three cards. */
        .dashboard-link {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 0 1.5rem;
          border-top: 1px solid rgba(${RGB.paper},0.06);
          font-family: "JetBrains Mono", monospace;
          font-size: 0.45rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-decoration: none;
          text-transform: uppercase;
          color: ${COLORS.muted};
          transition: color 180ms ease, background 180ms ease;
        }

        .dashboard-link:hover {
          color: ${COLORS.white};
          background: rgba(${RGB.red},0.08);
        }

        .dashboard-arrow {
          font-size: 0.85rem;
          color: ${COLORS.orange};
          transition: transform 180ms ease;
        }

        .dashboard-link:hover .dashboard-arrow {
          transform: translate(3px, -3px);
        }

        /* Desktop-only visual detail: tighter internal grids, a small
           radial dial in the corner of the race panel. */
        @media (min-width: 901px) {
          .dashboard-card:nth-child(2)::before,
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
            border: 1px solid rgba(${RGB.ember},0.08);
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
            background: rgba(${RGB.ember},0.08);
            pointer-events: none;
          }
        }

        /* Tablet: single-column cards, standings loses its tall span. */
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

        /* Mobile: compressed spacing and typography throughout. */
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

          .dashboard-grid {
            gap: 1px;
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

          .dashboard-section::after {
            width: 300px;
            height: 300px;
          }
        }

        /* Respect prefers-reduced-motion by dropping hover transitions and
           the decorative radial target. */
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
        <motion.div
          className="dashboard-intro"
          variants={introVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
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

        <div className="dashboard-grid">
          <motion.div
            className="dashboard-card dashboard-standings"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
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

          <motion.div
            className="dashboard-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            transition={{ delay: 0.12 }}
          >
            <NextRacePanel nextRace={nextRace} />
          </motion.div>

          <motion.div
            className="dashboard-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            transition={{ delay: 0.2 }}
          >
            <PredictionPanel prediction={prediction} nextRace={nextRace} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
