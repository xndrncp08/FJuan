/**
 * components/home/LastRaceSection.tsx
 *
 * Podium recap for the most recently completed race. Sits directly below
 * HeroSection and uses the shared SECTION_BACKGROUND gradient (see
 * lib/theme/palette.ts) so its top edge matches the ink color the hero
 * ends on — no border is needed to separate them, the color hand-off does
 * that on its own.
 *
 * Two color families are intentionally kept outside the brand palette:
 *  - RANK_COLORS (gold/silver/bronze) are a motorsport-wide convention for
 *    1st/2nd/3rd, not a site-specific choice.
 *  - TEAM_COLORS are each team's real livery color, used so the small team
 *    indicator dot is recognizable at a glance.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RED, PAPER, RGB, SECTION_BACKGROUND } from "../../lib/theme/palette";

interface LastRaceSectionProps {
  lastRace: any;
}

const RANK_COLORS = ["#FFD700", "#BFC3C8", "#CD7F32"];
const RANK_LABELS = ["WINNER", "SECOND", "THIRD"];

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

export default function LastRaceSection({ lastRace }: LastRaceSectionProps) {
  if (!lastRace || !lastRace.Results) return null;

  const podium = lastRace.Results.slice(0, 3);
  const raceDate = new Date(`${lastRace.date}T00:00:00`);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(5rem, 10vw, 9rem) 0",
        background: SECTION_BACKGROUND,
      }}
    >
      {/* Ambient glow, positioned to pick up where the hero's heat bloom
          leaves off. */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "55%",
          height: "70%",
          background: `radial-gradient(circle, rgba(${RGB.red},0.13) 0%, rgba(${RGB.red},0.04) 38%, transparent 72%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-15%",
          bottom: "-25%",
          width: "55%",
          height: "70%",
          background: `radial-gradient(circle, rgba(${RGB.red},0.07) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Fine grid, fading toward the top/bottom edges so it doesn't create
          a hard line against the sections above/below. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.35,
          backgroundImage: `linear-gradient(rgba(${RGB.paper},0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(${RGB.paper},0.025) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 75%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 75%, transparent)",
        }}
      />

      {/* Oversized outlined round number, purely decorative. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-2vw",
          top: "5%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(9rem, 25vw, 28rem)",
          lineHeight: 0.75,
          color: "transparent",
          WebkitTextStroke: `1px rgba(${RGB.paper},0.035)`,
          letterSpacing: "-0.08em",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {String(lastRace.round).padStart(2, "0")}
      </div>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(1.25rem, 4vw, 2rem)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Eyebrow: live indicator dot + label + round/date. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: RED,
                boxShadow: `0 0 16px rgba(${RGB.red},0.7)`,
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.48rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: RED,
              }}
            >
              Latest Classification
            </span>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.46rem",
              letterSpacing: "0.12em",
              color: `rgba(${RGB.paper},0.35)`,
            }}
          >
            RND {String(lastRace.round).padStart(2, "0")} / {formattedDate}
          </span>
        </motion.div>

        {/* Race title + location, with a link to the full calendar. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "3rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.045em",
                textTransform: "uppercase",
                color: PAPER,
                margin: 0,
                maxWidth: "850px",
              }}
            >
              {lastRace.raceName}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "1rem",
              }}
            >
              <span
                style={{
                  width: "28px",
                  height: "2px",
                  background: RED,
                  boxShadow: `0 0 14px rgba(${RGB.red},0.4)`,
                }}
              />
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: `rgba(${RGB.paper},0.42)`,
                }}
              >
                {lastRace.Circuit?.Location?.locality},{" "}
                {lastRace.Circuit?.Location?.country}
              </span>
            </div>
          </div>

          <Link
            href="/calendar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "0.7rem 1rem",
              color: `rgba(${RGB.paper},0.55)`,
              background: `rgba(${RGB.paper},0.045)`,
              border: `1px solid rgba(${RGB.paper},0.09)`,
              textDecoration: "none",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${RGB.red},0.1)`;
              el.style.borderColor = `rgba(${RGB.red},0.4)`;
              el.style.color = PAPER;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${RGB.paper},0.045)`;
              el.style.borderColor = `rgba(${RGB.paper},0.09)`;
              el.style.color = `rgba(${RGB.paper},0.55)`;
            }}
          >
            Full Results
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 6h10M6 1l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            alignItems: "end",
            gap: "1rem",
          }}
          className="last-race-podium"
        >
          {podium.map((result: any, index: number) => (
            <PodiumCard
              key={result.Driver?.driverId ?? index}
              result={result}
              rank={index + 1}
              isWinner={index === 0}
              index={index}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 760px) {
          .last-race-podium {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function PodiumCard({
  result,
  rank,
  isWinner,
  index,
}: {
  result: any;
  rank: number;
  isWinner: boolean;
  index: number;
}) {
  const rankColor = RANK_COLORS[rank - 1];
  const teamColor = TEAM_COLORS[result.Constructor?.constructorId] ?? RED;
  const driver = result.Driver;
  const time = result.Time?.time ?? result.status ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.65,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      style={{
        position: "relative",
        minHeight: isWinner ? "390px" : "340px",
        padding: isWinner ? "2rem" : "1.5rem",
        overflow: "hidden",
        // Winner keeps a gold tint (medal color) blended with the site's red;
        // second/third use a plain warm-paper tint instead of the old
        // neutral gray so they read as part of the same page.
        background: isWinner
          ? `linear-gradient(145deg, rgba(255,215,0,0.09), rgba(${RGB.paper},0.035) 45%, rgba(${RGB.red},0.05))`
          : `linear-gradient(145deg, rgba(${RGB.paper},0.055), rgba(${RGB.paper},0.018))`,
        border: `1px solid ${isWinner ? "rgba(255,215,0,0.22)" : `rgba(${RGB.paper},0.09)`}`,
        boxShadow: isWinner
          ? `0 30px 80px rgba(${RGB.ink},0.4), inset 0 1px rgba(${RGB.paper},0.08)`
          : `0 20px 60px rgba(${RGB.ink},0.35)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-35%",
          right: "-20%",
          width: "70%",
          height: "70%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rankColor}18 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "18%",
          right: "-20%",
          width: "65%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${rankColor}45, transparent)`,
          transform: "rotate(-28deg)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "3rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: isWinner ? "5rem" : "4rem",
              lineHeight: 0.8,
              color: rankColor,
              letterSpacing: "-0.06em",
              textShadow: `0 0 30px ${rankColor}22`,
            }}
          >
            {rank}
          </div>
          <div
            style={{
              marginTop: "8px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.42rem",
              letterSpacing: "0.18em",
              color: rankColor,
              opacity: 0.7,
            }}
          >
            {RANK_LABELS[rank - 1]}
          </div>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.42rem",
            color: `rgba(${RGB.paper},0.2)`,
            letterSpacing: "0.12em",
          }}
        >
          P{rank}
        </span>
      </div>

      <div style={{ position: "relative", marginBottom: "1.75rem" }}>
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "clamp(1.35rem, 2.5vw, 1.85rem)" : "1.25rem",
            lineHeight: 1,
            letterSpacing: "-0.025em",
            textTransform: "uppercase",
            color: PAPER,
          }}
        >
          {driver.givenName}
        </div>
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "clamp(1.35rem, 2.5vw, 1.85rem)" : "1.25rem",
            lineHeight: 1,
            letterSpacing: "-0.025em",
            textTransform: "uppercase",
            color: rankColor,
            marginTop: "4px",
          }}
        >
          {driver.familyName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginTop: "9px",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: teamColor,
              boxShadow: `0 0 10px ${teamColor}66`,
            }}
          />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.67rem",
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: teamColor,
            }}
          >
            {result.Constructor?.name}
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: isWinner ? "2rem" : "1.5rem",
          right: isWinner ? "2rem" : "1.5rem",
          bottom: isWinner ? "2rem" : "1.5rem",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          background: `rgba(${RGB.ink},0.35)`,
        }}
      >
        {[
          { label: "TIME", value: time },
          { label: "PTS", value: result.points },
          { label: "LAPS", value: result.laps },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ padding: "0.7rem 0.55rem", minWidth: 0 }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.35rem",
                letterSpacing: "0.12em",
                color: `rgba(${RGB.paper},0.25)`,
                marginBottom: "5px",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.72rem",
                color: `rgba(${RGB.paper},0.85)`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
